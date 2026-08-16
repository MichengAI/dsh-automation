export const SessionId = value => value
export const WorkspaceId = value => value
export const createUserMessage = value => value
export const installModelSelection = () => () => {}
export const setApprovalPolicy = () => {}
export const setSandboxMode = () => {}
export const defineTool = definition => definition
const schemaNode = new Proxy(() => schemaNode, {
  apply: () => schemaNode,
  get: () => schemaNode,
})
export default schemaNode
