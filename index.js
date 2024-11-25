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
            gui.changeState(Status.LOST_CONNECTION, error);
            await bluetoothHandler.disconnect();
        }
    } else {
        gui.changeState(Status.DISCONNECTING);

        await bluetoothHandler.disconnect();
        
        gui.changeState(Status.DISCONNECTED);
    }
});

gui.btnSend.addEventListener('click', async () => {
    const text = gui.getInputText();
    if (!text) {
        gui.displayWarning('No text to send');
        return;
    }

    gui.changeState(Status.SENDING);

    try {
        await bluetoothHandler.send(text);
    } catch (error) {
        gui.displayError('Error sending data: ' + error);
    } finally {
        gui.changeState(Status.SENT);
    }
});

gui.btnReceive.addEventListener('click', async () => {
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