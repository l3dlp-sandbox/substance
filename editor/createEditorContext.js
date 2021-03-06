import createComponentContext from './createComponentContext'

export default function createEditorContext (config, editorSession) {
  return Object.assign(createComponentContext(config), {
    config,
    editorSession: editorSession,
    editorState: editorSession.getEditorState(),
    surfaceManager: editorSession.surfaceManager,
    markersManager: editorSession.markersManager,
    keyboardManager: editorSession.keyboardManager,
    findAndReplaceManager: editorSession.findAndReplaceManager
  })
}
