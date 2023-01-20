import { Editable } from "@systemic-games/pixels-edit-animation";

const _editList: (Editable | undefined)[] = [];

/**
 * Store for Pixels Animation {@link Editable} objects that associate
 * a unique key with each registered object.
 */
const EditableStore = {
  /**
   * Returns a unique key for the given object.
   * @remarks The object is kept in an internal store, call {@link unregister} to remove it.
   * @param editable The Pixels Animation {@link Editable} object to register.
   * @returns The unique key associated with the object.
   */
  getKey: (editable: Editable): number => {
    const key = _editList.indexOf(editable);
    if (key < 0) {
      _editList.push(editable);
      return _editList.length - 1;
    } else {
      return key;
    }
  },

  /**
   * Remove the object from the store.
   * @remarks If the object is registered again, it will be assigned a new key.
   * @param editable The Pixels Animation {@link Editable} to remove.
   */
  unregister: (editable: Editable): void => {
    const key = _editList.indexOf(editable);
    if (key >= 0) {
      _editList[key] = undefined;
    }
  },
};

export default EditableStore;
