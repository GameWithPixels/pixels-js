/* eslint-disable no-bitwise */

// const encodeBase64 = (data: string) => {
//   return Buffer.from(data).toString("base64");
// };
// const decodeBase64 = (data: string) => {
//   return Buffer.from(data, "base64").toString("ascii");
// };

// from: https://stackoverflow.com/questions/42829838/react-native-atob-btoa-not-working-without-remote-js-debugging
const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
// @ts-expect-error atob already declared
const atob = (input = "") => {
  const str = input.replace(/[=]+$/, "");
  let output = "";

  if (str.length % 4 === 1) {
    throw new Error(
      "'atob' failed: The string to be decoded is not correctly encoded."
    );
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

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
      const content = atob(
        fr.result.substr("data:application/octet-stream;base64,".length)
      );
      // const {toByteArray} = require('base64-js');
      const buffer = new ArrayBuffer(content.length);
      const view = new Uint8Array(buffer);
      view.set(Array.from(content).map((c) => c.charCodeAt(0)));
      // @ts-ignore Property '_result' does not exist on type 'FileReader'
      this._result = buffer;
      // @ts-ignore Property '_setReadyState' does not exist on type 'FileReader'
      this._setReadyState(this.DONE);
    } else {
      throw new Error("Unsupported");
    }
  };
  fr.readAsDataURL(blob);
};
