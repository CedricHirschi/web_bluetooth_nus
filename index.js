const btnConnect = document.getElementById('connect-btn');
const btnReceive = document.getElementById('receive-btn');
const btnSend = document.getElementById('send-btn');
const inputSend = document.getElementById('send-text');
const outputReceive = document.getElementById('receive-text');
const statusLabel = document.getElementById('status-label');
const warningBanner = document.getElementById('warning-banner');

const bluetoothHandler = new BluetoothNUSHandler();

btnConnect.addEventListener('click', async () => {
    if (!await bluetoothHandler.isConnected()) {
        statusLabel.textContent = 'Connecting...';
        try {
            const deviceName = await bluetoothHandler.connect();
            if (deviceName) {
                btnConnect.textContent = 'Disconnect';
                statusLabel.textContent = 'Connected to ' + deviceName;
                btnReceive.disabled = false;
                btnSend.disabled = false;
                inputSend.disabled = false;
            } else {
                statusLabel.textContent = 'No device selected';
            }
        } catch (error) {
            statusLabel.textContent = 'Connection failed: ' + error;
            await bluetoothHandler.disconnect();
        }
    } else {
        statusLabel.textContent = 'Disconnecting...';
        await bluetoothHandler.disconnect();
        btnConnect.textContent = 'Connect';
        statusLabel.textContent = 'Disconnected';
        btnReceive.disabled = true;
        btnSend.disabled = true;
        inputSend.disabled = true;
    }
});

btnSend.addEventListener('click', async () => {
    const text = inputSend.value;
    await bluetoothHandler.send(text);
});

btnReceive.addEventListener('click', async () => {
    if (btnReceive.textContent === 'Disable Reception') {
        await bluetoothHandler.stopNotifications();
        btnReceive.textContent = 'Enable Reception';
    } else {
        await bluetoothHandler.startNotifications((data) => {
            outputReceive.textContent += data;
        });
        btnReceive.textContent = 'Disable Reception';
    }
});

// Check connection every second
setInterval(async () => {
    if (await bluetoothHandler.isConnected()) {
        statusLabel.textContent = 'Connected to ' + bluetoothHandler.deviceName;
    } else {
        if (btnReceive.textContent === 'Disable Reception') {
            await bluetoothHandler.stopNotifications();
            btnReceive.textContent = 'Enable Reception';
        }
        btnConnect.textContent = 'Connect';
        statusLabel.textContent = 'Disconnected';
        btnReceive.disabled = true;
        btnSend.disabled = true;
        inputSend.disabled = true;
    }
}, 1000);

// On website load, check if Bluetooth is available
if (!('bluetooth' in navigator)) {
    warningBanner.style.display = 'block';
    btnConnect.disabled = true;
    statusLabel.textContent = 'Bluetooth not available';

    const user = navigator.userAgent;
    const os = user.includes('Android') ? 'Android' :
               user.includes('iPhone') || user.includes('iPad') ? 'iOS' :
               user.includes('Linux') ? 'Linux' :
               user.includes('Windows') ? 'Windows' :
               user.includes('Mac') ? 'MacOS' : 'Unknown';

    warningBanner.innerHTML = `<strong>Warning!</strong> Bluetooth is not available in this session.<br>`;

    switch (os) {
        case 'Android':
            warningBanner.innerHTML += `On Android, please use Chrome.`;
            break;
        case 'iOS':
            warningBanner.innerHTML += `On iOS, please use Safari.`;
            break;
        case 'Linux':
            warningBanner.innerHTML += `On Linux, please use Chrome.<br>`;
            warningBanner.innerHTML += `You may need to enable the flag "Experimental Web Platform features" by entering <code>chrome://flags/#enable-experimental-web-platform-features</code> into your browser's address bar as well as "Web Bluetooth New Permissions Backend" by entering <code>chrome://flags/#enable-web-bluetooth-new-permissions-backend</code>.`;
            break;
        case 'Windows':
            warningBanner.innerHTML += `On Windows, please use Chrome.`;
            break;
        case 'MacOS':
            warningBanner.innerHTML += `On MacOS, please use Chrome.`;
            break;
        default:
            break;
    }
}