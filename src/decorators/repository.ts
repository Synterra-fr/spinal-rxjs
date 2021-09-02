export function SpinalHubRepository(nodeName: string) {
  return (constructorFunction: Function) => {
    constructorFunction.prototype.NODE_NAME = nodeName;
  };
}
