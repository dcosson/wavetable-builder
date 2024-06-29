export const insertAtIndex = <T>(array: Array<T>, index: number, item: T): Array<T> => {
  return [
    ...array.slice(0, index),
    item,
    ...array.slice(index)
  ];
};
