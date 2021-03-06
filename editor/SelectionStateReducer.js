import { documentHelpers, Selection, selectionHelpers } from '../model'

export default class SelectionStateReducer {
  constructor (editorState) {
    this.editorState = editorState
    editorState.addObserver(['document', 'selection'], this.update, this, { stage: 'update' })
  }

  update () {
    const editorState = this.editorState
    const doc = editorState.document
    const sel = editorState.selection
    const newState = this.deriveState(doc, sel)
    editorState.selectionState = newState
  }

  deriveState (doc, sel) {
    const state = this.createState(sel)
    this.deriveContext(state, doc, sel)
    this.deriveContainerSelectionState(state, doc, sel)
    this.deriveAnnoState(state, doc, sel)
    if (doc.getIndex('markers')) {
      this.deriveMarkerState(state, doc, sel)
    }
    this.deriveSelectedText(state, doc, sel)

    return state
  }

  deriveContext (state, doc, sel) {
    if (!sel || sel.isNull()) return
    if (sel.isPropertySelection() || sel.isNodeSelection() || sel.isCustomSelection()) {
      const nodeId = sel.getNodeId()
      const node = doc.get(nodeId)
      if (node) {
        state.xpath = node.getXpath().toArray()
        state.node = node
        if (sel.isPropertySelection()) {
          state.property = node.getSchema().getProperty(sel.getPropertyName())
        }
      }
    }
  }

  deriveContainerSelectionState (state, doc, sel) {
    const containerPath = sel.containerPath
    if (containerPath) {
      state.containerPath = containerPath
      const nodeIds = doc.get(containerPath)
      const startId = sel.start.getNodeId()
      const endId = sel.end.getNodeId()
      const startNode = documentHelpers.getContainerRoot(doc, containerPath, startId)
      // FIXME: it happened that we have set the containerPath incorrectly
      // e.g. body.content for a selection in abstract
      if (!startNode) {
        console.error('FIXME: invalid ContainerSelection')
        return
      }
      const startPos = startNode.getPosition()
      if (startPos > 0) {
        state.previousNode = documentHelpers.getPreviousNode(doc, containerPath, startPos)
      }
      state.isFirst = selectionHelpers.isFirst(doc, containerPath, sel.start)
      let endPos
      if (endId === startId) {
        endPos = startPos
      } else {
        const endNode = documentHelpers.getContainerRoot(doc, containerPath, endId)
        endPos = endNode.getPosition()
      }
      if (endPos < nodeIds.length - 1) {
        state.nextNode = documentHelpers.getNextNode(doc, containerPath, endPos)
      }
      state.isLast = selectionHelpers.isLast(doc, containerPath, sel.end)
    }
  }

  deriveAnnoState (state, doc, sel) {
    // create a mapping by type for the currently selected annotations
    const annosByType = new Map()
    function _add (anno) {
      let annos = annosByType.get(anno.type)
      if (!annos) {
        annos = []
        annosByType.set(anno.type, annos)
      }
      annos.push(anno)
    }
    const propAnnos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel)
    propAnnos.forEach(_add)
    if (propAnnos.length === 1) {
      const firstAnno = propAnnos[0]
      if (firstAnno.isInlineNode()) {
        state.isInlineNodeSelection = firstAnno.getSelection().equals(sel)
        state.node = firstAnno
      }
    }
    state.annos = propAnnos

    const containerPath = sel.containerPath
    if (containerPath) {
      const containerAnnos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, containerPath)
      containerAnnos.forEach(_add)
    }
    state.annosByType = annosByType
  }

  deriveMarkerState (state, doc, sel) {
    const markers = documentHelpers.getMarkersForSelection(doc, sel)
    state.markers = markers
  }

  deriveSelectedText (state, doc, sel) {
    if (sel && sel.isPropertySelection() && !sel.isCollapsed()) {
      const text = documentHelpers.getTextForSelection(doc, sel)
      state.selectedText = text
    }
  }

  createState (sel) {
    return new SelectionState(sel)
  }
}

class SelectionState {
  constructor (sel) {
    this.selection = sel || Selection.null

    Object.assign(this, {
      // all annotations under the current selection
      annosByType: null,
      // markers under the current selection
      markers: null,
      // flags for inline nodes
      isInlineNodeSelection: false,
      // container information (only for ContainerSelection)
      containerPath: null,
      // nodes
      node: null,
      previousNode: null,
      nextNode: null,
      // active annos
      annos: [],
      // if the previous node is one char away
      isFirst: false,
      // if the next node is one char away
      isLast: false,
      // current context
      xpath: [],
      property: null,
      // for non collapsed property selections
      selectedText: ''
    })
  }
}
