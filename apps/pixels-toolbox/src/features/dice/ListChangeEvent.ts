export type ListChangeOperation = "add" | "remove";

export interface ListChange<T> {
  operation: ListChangeOperation;
  item: T;
}

export class ListChangeEvent<T> extends CustomEvent<ListChange<T>> {}
