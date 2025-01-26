const warningBanner = document.getElementById('warning-banner');

const bluetoothHandler = new BluetoothNUSHandler();
const gui = new GUI();

gui.btnConnect.addEventListener('click', async () => {
    if (!bluetoothHandler.isConnected()) {
        gui.changeState(Status.CONNECTING);
        try {
            const deviceName = await bluetoothHandler.connect();

            gui.changeState(Status.CONNECTED);
        } catch (error) {
            if (error.name === 'SecurityError') {
                gui.changeState(Status.LOST_CONNECTION, 'Your browser does not allow Bluetooth connections. Please check your settings.');
            } else if (error.name === 'NetworkError') {
                gui.changeState(Status.LOST_CONNECTION, 'Please retry connecting to the device.');
            } else {
                gui.changeState(Status.LOST_CONNECTION, error);
            }

            await bluetoothHandler.disconnect();
        }
    } else {
        gui.changeState(Status.DISCONNECTING);

        await bluetoothHandler.disconnect();

        gui.changeState(Status.DISCONNECTED);
    }
});

function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    // Convert to Uint8Array
    const uint8Array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
        uint8Array[i] = bytes[i];
    }

    return uint8Array;
}

gui.btnSend.addEventListener('click', async () => {
    let text = gui.getInput();
    if (!text) {
        gui.displayWarning('No text to send');
        return;
    }

    if (gui.inputIsHex()) {
        text = text.replace(/\s+/g, '');
        if (!text) {
            gui.displayWarning('No hex input');
            return;
        }

        if (!/^[0-9A-Fa-f]+$/.test(text)) {
            gui.displayWarning('Invalid hex input');
            return;
        }

        text = hexToBytes(text);
    }

    gui.changeState(Status.SENDING);

    try {
        await bluetoothHandler.send(text, gui.inputIsHex());
    } catch (error) {
        gui.displayError('Error sending data: ' + error);
    } finally {
        gui.changeState(Status.SENT);
    }
});

gui.checkReceive.addEventListener('click', async () => {
    if (!bluetoothHandler.isConnected()) return;

    if (gui.rxEnabled) {
        gui.changeState(Status.DISABLING_RX);

        try {
            await bluetoothHandler.stopNotifications();

            gui.changeState(Status.DISABLED_RX);
        } catch (error) {
            gui.displayWarning('Error disabling reception: ' + error);
            gui.changeState(Status.ENABLED_RX);
        }
    } else {
        gui.changeState(Status.ENABLING_RX);

        try {
            await bluetoothHandler.startNotifications((data) => gui.addOutput(data));

            gui.changeState(Status.ENABLED_RX);
        } catch (error) {
            gui.displayWarning('Error enabling reception: ' + error);
            gui.changeState(Status.DISABLED_RX);
        }
    }
});

// Check connection every second
setInterval(async () => {
    if (!bluetoothHandler.isConnected() && gui.isConnected) gui.changeState(Status.LOST_CONNECTION, 'Connection lost');
}, 1000);

// On website load, check if Bluetooth is available
if (!('bluetooth' in navigator)) gui.displayWarningBanner();