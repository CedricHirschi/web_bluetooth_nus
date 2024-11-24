const btnConnect = document.getElementById('connect-btn');
const btnReceive = document.getElementById('receive-btn');
const btnSend = document.getElementById('send-btn');
const inputSend = document.getElementById('send-text');
const outputReceive = document.getElementById('receive-text');
const statusLabel = document.getElementById('status-label');

const nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const nordicUARTTXCharacteristic = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const nordicUARTRXCharacteristic = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

let currentDevice = null;
let uartService = null;
let uartTxCharacteristic = null;
let uartRxCharacteristic = null;

function manageConnection() {
    (currentDevice === null) ? manageConnectionConnect() : manageConnectionDisconnect();
}

async function manageConnectionConnect() {
    statusLabel.textContent = 'Connecting...';

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [nordicUARTService] }]
        });

        await device.gatt.connect();

        uartService = await device.gatt.getPrimaryService(nordicUARTService);
        uartTxCharacteristic = await uartService.getCharacteristic(nordicUARTTXCharacteristic);
        uartRxCharacteristic = await uartService.getCharacteristic(nordicUARTRXCharacteristic);

        currentDevice = device;

        btnConnect.textContent = 'Disconnect';
        statusLabel.textContent = 'Connected to ' + device.name;

        btnReceive.disabled = false;
        btnSend.disabled = false;
        inputSend.disabled = false;
    } catch (error) {
        btnConnect.textContent = 'Connect';
        statusLabel.textContent = 'No device selected';

        if (error.name === 'NotFoundError') return;

        await manageConnectionDisconnect();

        console.warn('Connection failed:', error);
        statusLabel.textContent = 'Connection failed: ' + error;
    }
}

async function manageConnectionDisconnect() {
    statusLabel.textContent = 'Disconnecting...';

    if (currentDevice !== null) await currentDevice.gatt.disconnect();

    currentDevice = null;

    btnConnect.textContent = 'Connect';
    statusLabel.textContent = 'Disconnected';

    btnReceive.disabled = true;
    btnSend.disabled = true;
    inputSend.disabled = true;
}

btnConnect.addEventListener('click', manageConnection);


async function rxHandler(event) {
    const value = event.target.value;
    const text = new TextDecoder().decode(value);

    outputReceive.textContent += text;
}


async function manageReception() {
    if (currentDevice === null || uartRxCharacteristic === null) return;

    if (btnReceive.textContent === 'Stop receiving') {
        await uartRxCharacteristic.stopNotifications();
        uartRxCharacteristic.removeEventListener('characteristicvaluechanged', rxHandler);

        btnReceive.textContent = 'Start receiving';
    } else {
        await uartRxCharacteristic.startNotifications();
        uartRxCharacteristic.addEventListener('characteristicvaluechanged', rxHandler);

        btnReceive.textContent = 'Stop receiving';
    }
}

btnReceive.addEventListener('click', manageReception);


async function manageSending() {
    if (currentDevice === null) return;

    const text = inputSend.value;
    const data = new TextEncoder().encode(text);

    try {
        await uartTxCharacteristic.writeValue(data);
    } catch (error) {
        console.warn('Falling back to minimum MTU:', error);

        const MTU = 20;

        for (let i = 0; i < data.length; i += MTU) {
            await uartTxCharacteristic.writeValueWithoutResponse(data.slice(i, i + MTU));
        }
    }
}

btnSend.addEventListener('click', manageSending);

// Check connection every second
setInterval(() => {
    if (currentDevice === null) return;

    currentDevice.gatt.getPrimaryService(nordicUARTService)
        .then(() => statusLabel.textContent = 'Connected to ' + currentDevice.name)
        .catch(() => {
            if (btnReceive.textContent === 'Stop receiving') manageReception();
            manageConnectionDisconnect()
        });
}, 1000);