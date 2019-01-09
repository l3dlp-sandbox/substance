import { test } from 'substance-test'
import nestedContainers from './fixture/nestedContainers'
import setupEditor from './fixture/setupEditor'

test("IsolatedNode: IsolatedNodes should be 'not-selected' when selection is null", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection(null)
  isolatedNodes.forEach(n => _notSelected(t, n))
  t.end()
})

test("IsolatedNode: IsolatedNodes should be 'not-selected' when selection is somewhere else", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    surfaceId: 'body'
  })
  isolatedNodes.forEach(function (isolated) {
    t.ok(isolated.isNotSelected(), "isolated node '" + isolated.getId() + "' should not be selected.")
  })
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'selected' with node selection", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'node',
    nodeId: 'c1',
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  let expected = {
    'body/c1': 'selected',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'co-selected' with spanning container selection", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'container',
    containerPath: ['body', 'nodes'],
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
    surfaceId: 'body'
  })
  let expected = {
    'body/c1': 'co-selected',
    // Note: 'co-selection' does not propagate down
    // it is a state related to the parent container
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'focused' when having the selection", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['c1_p1', 'content'],
    startOffset: 0,
    // TODO: we need to find a more intuitive way to surfaceIds
    surfaceId: 'body/c1/c1'
  })
  let expected = {
    'body/c1': 'focused',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'co-focused' when child is having the selection", t => {
  let { editorSession, editor } = setupEditor(t, nestedContainers)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['c2_p1', 'content'],
    startOffset: 0,
    // TODO: we need to find a more intuitive way to surfaceIds
    surfaceId: 'body/c1/c1/c2/c2'
  })
  let expected = {
    'body/c1': 'co-focused',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': 'focused'
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: Issue #696: IsolatedNode should detect 'co-focused' robustly in presence of surface ids with same prefix", t => {
  // as experienced in #696 it happened that co-focused state was infered just
  // by using startsWith on the surface path. This was leading to wrong
  // co-focused states when e.g. two isolated nodes `body/entity` and `body/entity-1`
  // exist. I.e. one surfaceId was a prefix of another one.
  let { editorSession, editor } = setupEditor(t, _twoStructuredNodes)
  let isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['sn2', 'title'],
    startOffset: 0,
    surfaceId: 'body/sn2/sn2.title'
  })
  let expected = {
    'body/sn': null,
    'body/sn2': 'focused'
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

function _notSelected (t, isolated) {
  t.ok(isolated.isNotSelected(), "isolated node '" + isolated.getId() + "' should not be selected.")
}

function _modeOk (t, isolated, expected) {
  let id = isolated.getId()
  t.looseEqual(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
}

function _twoStructuredNodes (doc) {
  let body = doc.get('body')
  body.append(doc.create({
    type: 'structured-node',
    id: 'sn',
    title: 'Foo'
  }))
  body.append(doc.create({
    type: 'structured-node',
    id: 'sn2',
    title: 'Bar'
  }))
}
