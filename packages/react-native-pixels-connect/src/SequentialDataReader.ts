/**
 * Reads the data sequentially using a data view.
 */
export default class SequentialDataReader {
  private _dataView: DataView;
  private _index = 0;

  constructor(dataView: DataView) {
    this._dataView = dataView;
  }

  readU8(): number {
    return this.incAndRet(this._dataView.getUint8(this._index), 1);
  }

  readU16(): number {
    // Note: serialization needs to have little endianness
    return this.incAndRet(this._dataView.getUint16(this._index, true), 2);
  }

  readU32(): number {
    return this.incAndRet(this._dataView.getUint32(this._index, true), 4);
  }

  readFloat(): number {
    return this.incAndRet(this._dataView.getFloat32(this._index, true), 4);
  }

  skip(numBytes = 1): void {
    this._index += Math.max(0, numBytes);
  }

  private incAndRet<T>(v: T, inc: number): T {
    this._index += inc;
    return v;
  }
}
