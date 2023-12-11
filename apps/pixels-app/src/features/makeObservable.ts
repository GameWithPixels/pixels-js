import { decorators } from "@systemic-games/pixels-edit-animation";
import {
  makeObservable as mobxObservable,
  observable,
  AnnotationMapEntry,
} from "mobx";

export function makeObservable<T extends object>(obj: T): T {
  const propsData = decorators.getPropsWithObservable(obj);
  if (propsData.length) {
    const annotations: Partial<Record<keyof T, AnnotationMapEntry>> = {};
    for (const data of propsData) {
      if (data.propertyKey !== "keyframes") {
        annotations[data.propertyKey as keyof T] = observable;
        const prop = obj[data.propertyKey as keyof T];
        if (prop) {
          if (Array.isArray(prop)) {
            for (const p of prop) {
              makeObservable(p);
            }
          } else if (typeof prop === "object") {
            makeObservable(prop);
          }
        }
      }
    }
    mobxObservable(obj, annotations);
  }
  return obj;
}
