import { toByteArray } from "base64-js";

// https://github.com/facebook/react-native/issues/21209#issuecomment-495294672
FileReader.prototype.readAsArrayBuffer = function (blob: Blob) {
  if (this.readyState === this.LOADING) throw new Error("InvalidStateError");
  // @ts-ignore Property '_setReadyState' does not exist on type 'FileReader'
  this._setReadyState(this.LOADING);
  // @ts-ignore Property '_result' does not exist on type 'FileReader'
  this._result = null;
  // @ts-ignore Property '_error' does not exist on type 'FileReader'
  this._error = null;
  const fr = new FileReader();
  fr.onloadend = () => {
    if (typeof fr.result === "string") {
      const index = fr.result.indexOf(";base64,");
      if (index === -1) {
        throw new Error(
          `Data URL did not contain base64 part, starts with: ${fr.result.substring(0, 30)}`
        );
      }
      const data = fr.result.substring(index + 8);
      // @ts-ignore Property '_result' does not exist on type 'FileReader'
      this._result = toByteArray(data).buffer; // Faster than Buffer.from()
      // @ts-ignore Property '_setReadyState' does not exist on type 'FileReader'
      this._setReadyState(this.DONE);
    } else {
      throw new Error("Unsupported");
    }
  };
  fr.readAsDataURL(blob);
};
