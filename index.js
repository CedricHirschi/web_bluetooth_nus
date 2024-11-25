const btnConnect = document.getElementById('connect-btn');
const btnReceive = document.getElementById('receive-btn');
const btnSend = document.getElementById('send-btn');
const inputSend = document.getElementById('send-text');
const outputReceive = document.getElementById('receive-text');
const outputTimestamps = document.getElementById('receive-timestamps');
const statusLabel = document.getElementById('status-label');
const warningBanner = document.getElementById('warning-banner');

const bluetoothHandler = new BluetoothNUSHandler();

btnConnect.addEventListener('click', async () => {
    if (!bluetoothHandler.isConnected()) {
        statusLabel.textContent = 'Connecting...';
        btnConnect.textContent = 'Connecting...';
        btnConnect.disabled = true;
        try {
            const deviceName = await bluetoothHandler.connect();
            if (deviceName) {
                btnConnect.textContent = 'Disconnect';
                statusLabel.textContent = 'Connected to ' + deviceName;
                btnConnect.disabled = false;
                btnReceive.disabled = false;
                btnSend.disabled = false;
                inputSend.disabled = false;
            } else {
                statusLabel.textContent = 'No device selected';
                btnConnect.textContent = 'Connect';
                btnConnect.disabled = false;
            }
        } catch (error) {
            statusLabel.textContent = 'Connection failed: ' + error;
            await bluetoothHandler.disconnect();
        }
    } else {
        statusLabel.textContent = 'Disconnecting...';
        btnConnect.textContent = 'Disconnecting...';
        btnConnect.disabled = true;
        await bluetoothHandler.disconnect();
        btnConnect.textContent = 'Connect';
        statusLabel.textContent = 'Disconnected';
        btnConnect.disabled = false;
        btnReceive.disabled = true;
        btnSend.disabled = true;
        inputSend.disabled = true;
    }
});

btnSend.addEventListener('click', async () => {
    const text = inputSend.value;
    if (!text) return;

    btnSend.textContent = 'Sending...';
    btnSend.disabled = true;
    inputSend.disabled = true;

    try {
        await bluetoothHandler.send(text);
    } catch (error) {
        statusLabel.textContent = 'Send failed: ' + error;
    } finally {
        btnSend.textContent = 'Send';
        btnSend.disabled = false;
        inputSend.disabled = false;
    }
});

function getFormattedTimestamp() {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

btnReceive.addEventListener('click', async () => {
    if (!bluetoothHandler.isConnected()) return;

    btnReceive.disabled = true;

    if (btnReceive.textContent === 'Disable Reception') {
        btnReceive.textContent = 'Disabling...';
        
        try {
            await bluetoothHandler.stopNotifications();

            btnReceive.textContent = 'Enable Reception';
            btnReceive.classList.replace('btn-danger', 'btn-success');
            
            statusLabel.textContent = 'Reception disabled';
        } catch (error) {
            statusLabel.textContent = 'Error disabling reception: ' + error;
            btnReceive.textContent = 'Disable Reception';
        }
    } else {
        btnReceive.textContent = 'Enabling...';
        
        try {
            await bluetoothHandler.startNotifications((data) => {
                outputTimestamps.textContent += getFormattedTimestamp() + '\n';
                outputReceive.textContent += data;

                // Scroll both textareas to the bottom
                outputReceive.scrollTop = outputReceive.scrollHeight;
                outputTimestamps.scrollTop = outputReceive.scrollTop;
            });

            btnReceive.textContent = 'Disable Reception';
            btnReceive.classList.replace('btn-success', 'btn-danger');
            btnReceive.disabled = false;

            statusLabel.textContent = 'Reception enabled';
        } catch (error) {
            statusLabel.textContent = 'Error enabling reception: ' + error;
            btnReceive.textContent = 'Enable Reception';
        }
    }

    btnReceive.disabled = false;
});

// Synchronize scrolling between the two textareas
outputReceive.addEventListener('scroll', () => {
    outputTimestamps.scrollTop = outputReceive.scrollTop;
});

// Check connection every second
setInterval(async () => {
    if (bluetoothHandler.isConnected()) {
        // statusLabel.textContent = 'Connected to ' + bluetoothHandler.deviceName;
    } else {
        if (btnReceive.textContent === 'Disable Reception') {
            btnReceive.textContent = 'Enable Reception';
            btnReceive.classList.replace('btn-danger', 'btn-success');
        }
        if (btnConnect.textContent === 'Connecting...') return;
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