package com.systemic.zplprint;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;

import androidx.annotation.NonNull;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

public class BluetoothSerial {
    private BluetoothSocket _socket;
    private OutputStream _outputStream;
    private InputStream _inputStream;

    public BluetoothSerial(@NonNull BluetoothDevice device) throws IOException, SecurityException {
        final UUID sppUUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
        _socket = device.createRfcommSocketToServiceRecord(sppUUID);
        _socket.connect();
        _outputStream = _socket.getOutputStream();
        _inputStream = _socket.getInputStream();
    }

    public void send(byte[] data) throws IOException {
        _outputStream.write(data);
    }

    public boolean close() {
        try {
            _outputStream.flush();
        } catch (IOException e) {
        }
        try {
            _socket.close();
            return true;
        } catch (IOException e) {
            return false;
        }
    }
}
