const Status = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2,
    DISCONNECTING: 3,
    NO_TEXT: 4,
    LOST_CONNECTION: 5,
    SENDING: 6,
    DISABLING_RX: 7,
    DISABLED_RX: 8,
    ENABLING_RX: 9,
    ENABLED_RX: 10,
    SENT: 11,
    NO_BLUETOOTH: 12,
};

const statusClasses = {
    [Status.DISCONNECTED]: { bg: 'bg-secondary', text: 'text-white' },
    [Status.CONNECTING]: { bg: 'bg-info', text: 'text-white' },
    [Status.CONNECTED]: { bg: 'bg-success', text: 'text-white' },
    [Status.DISCONNECTING]: { bg: 'bg-warning', text: 'text-dark' },
    [Status.NO_TEXT]: { bg: 'bg-light', text: 'text-dark' },
    [Status.LOST_CONNECTION]: { bg: 'bg-danger', text: 'text-white' },
    [Status.SENDING]: { bg: 'bg-info', text: 'text-white' },
    [Status.SENT]: { bg: 'bg-success', text: 'text-white' },
    [Status.DISABLING_RX]: { bg: 'bg-warning', text: 'text-dark' },
    [Status.DISABLED_RX]: { bg: 'bg-secondary', text: 'text-white' },
    [Status.ENABLING_RX]: { bg: 'bg-info', text: 'text-white' },
    [Status.ENABLED_RX]: { bg: 'bg-success', text: 'text-white' },
    [Status.NO_BLUETOOTH]: { bg: 'bg-danger', text: 'text-white' },
};

class GUI {
    constructor() {
        this.btnConnect = document.getElementById('connect-btn');
        this.checkReceive = document.getElementById('receive-chk');
        this.statusReceive = document.getElementById('receive-st');
        this.btnSend = document.getElementById('send-btn');
        this.btnClear = document.getElementById('clear-btn');
        this.inputSend = document.getElementById('send-text');
        this.modeText = document.getElementById('mode-text');
        this.modeHex = document.getElementById('mode-hex');
        this.modeOutputText = document.getElementById('output-mode-text');
        this.modeOutputHex = document.getElementById('output-mode-hex');
        this.outputReceive = document.getElementById('receive-text');
        this.btnSave = document.getElementById('save-btn');
        this.warningBanner = document.getElementById('warning-banner');
        this.statusMessage = document.getElementById('status-message');
        this.statusSpinner = document.getElementById('status-spinner');
        this.statusDevice = document.getElementById('status-device');

        this.btnClear.addEventListener('click', () => {
            this.outputs = [];
            this._formatOutput();
        });

        this.modeOutputText.addEventListener('change', () => this._formatOutput());
        this.modeOutputHex.addEventListener('change', () => this._formatOutput());

        this.btnSave.addEventListener('click', () => {
            const outputText = document.getElementById('receive-text').value;
            if (!outputText) {
                this.displayWarning('No output to save');
                return;
            }

            const isHexMode = document.getElementById('output-mode-hex').checked;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            if (isHexMode) {
                // Convert hex string to binary
                const hexArray = outputText.split(' ');
                const uint8Array = new Uint8Array(hexArray.map(hex => parseInt(hex, 16)));
                const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `output-${timestamp}.bin`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Save as text
                const blob = new Blob([outputText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `output-${timestamp}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });

        this.isConnected = false;
        this.rxEnabled = false;

        this._clearStatusClasses();

        this.changeState(Status.DISCONNECTED);

        this.outputs = [];
    }

    _clearStatusClasses() {
        const classesToRemove = [
            'bg-secondary', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger',
            'text-white', 'text-dark', 'bg-light'
        ];
        this.statusMessage.classList.remove(...classesToRemove);
        // this.statusDevice.classList.remove(...classesToRemove);
    }

    _applyStatusClasses(status) {
        const classes = statusClasses[status];
        if (classes) {
            this.statusMessage.classList.add(classes.bg, classes.text);
            // this.statusDevice.classList.add(classes.bg, classes.text);
        }
    }

    changeState(status, error = '') {
        this._clearStatusClasses();
        this._applyStatusClasses(status);

        switch (status) {
            case Status.DISCONNECTED:
                this.btnConnect.textContent = 'Connect';
                this.statusMessage.textContent = 'Disconnected';
                this.btnConnect.disabled = false;
                this.checkReceive.disabled = true;
                this.checkReceive.checked = false;
                this.statusReceive.textContent = 'Receive: Off';
                this.btnSend.disabled = true;
                this.inputSend.disabled = true;
                this.statusDevice.textContent = 'Device: None';

                this.isConnected = false;
                this.rxEnabled = false;
                break;
            case Status.CONNECTING:
                this.statusMessage.textContent = 'Connecting...';
                this.btnConnect.textContent = 'Connecting...';
                this.btnConnect.disabled = true;
                this.statusSpinner.style.display = 'inline-block';
                break;
            case Status.CONNECTED:
                this.btnConnect.textContent = 'Disconnect';
                this.statusMessage.textContent = 'Connected to ' + bluetoothHandler.deviceName;
                this.btnConnect.disabled = false;
                this.checkReceive.disabled = false;
                this.checkReceive.checked = false;
                this.statusReceive.textContent = 'Receive: Off';
                this.btnSend.disabled = false;
                this.inputSend.disabled = false;
                this.statusSpinner.style.display = 'none';
                this.statusDevice.textContent = 'Device: ' + bluetoothHandler.deviceName;

                this.isConnected = true;
                this.rxEnabled = false;
                break;
            case Status.DISCONNECTING:
                this.statusMessage.textContent = 'Disconnecting...';
                this.btnConnect.textContent = 'Disconnecting...';
                this.btnConnect.disabled = true;
                break;
            case Status.NO_TEXT:
                this.btnSend.textContent = 'Sending...';
                this.btnSend.disabled = true;
                this.inputSend.disabled = true;
                break;
            case Status.LOST_CONNECTION:
                if (error !== '') this.statusMessage.textContent = 'Connection failed: ' + error;
                else this.statusMessage.textContent = 'Connection failed';

                this.btnConnect.textContent = 'Connect';
                this.btnConnect.disabled = false;
                this.checkReceive.disabled = true;
                this.checkReceive.checked = false;
                this.statusReceive.textContent = 'Receive: Off';
                this.btnSend.disabled = true;
                this.inputSend.disabled = true;
                this.statusDevice.textContent = 'Device: None';

                this.statusSpinner.style.display = 'none';

                this.isConnected = false;
                this.rxEnabled = false;
                break;
            case Status.SENDING:
                this.btnSend.textContent = 'Sending...';
                this.btnSend.disabled = true;
                this.inputSend.disabled = true;
                break;
            case Status.SENT:
                this.btnSend.textContent = 'Send';
                this.btnSend.disabled = false;
                this.inputSend.disabled = false;
                break;
            case Status.DISABLING_RX:
                this.checkReceive.disabled = true;
                this.statusReceive.textContent = 'Receive: Disabling...';
                break;
            case Status.DISABLED_RX:
                this.checkReceive.disabled = false;
                this.checkReceive.checked = false;
                this.statusReceive.textContent = 'Receive: Off';

                this.rxEnabled = false;
                break;
            case Status.ENABLING_RX:
                this.checkReceive.disabled = true;
                this.statusReceive.textContent = 'Receive: Enabling...';
                break;
            case Status.ENABLED_RX:
                this.checkReceive.disabled = false;
                this.checkReceive.checked = true;
                this.statusReceive.textContent = 'Receive: On';

                this.rxEnabled = true;
                break;
            case Status.NO_BLUETOOTH:
                this.btnConnect.disabled = true;
                this.checkReceive.disabled = true;
                this.checkReceive.checked = false;
                this.statusReceive.textContent = 'Receive: Off';
                this.btnSend.disabled = true;
                this.inputSend.disabled = true;

                this.isConnected = false;
                this.rxEnabled = false;
                break;

            default:
                break
        }
    }

    displayWarning(message) {
        this.statusMessage.textContent = message;
    }

    displayError(message) {
        this.statusMessage.textContent = message;
    }

    addOutput(text) {
        this.outputs.push(text);

        console.log(this.outputs);

        this._formatOutput();
    }

    // private method
    _formatOutput() {

        // this.outputs is an array of ArrayBuffer

        let text = '';

        if (this.outputIsHex()) {
            for (let i = 0; i < this.outputs.length; i++) {
                for (let j = 0; j < this.outputs[i].byteLength; j++) {
                    text += this.outputs[i].getUint8(j).toString(16).padStart(2, '0').toUpperCase() + ' ';
                }
            }
        } else {
            for (let i = 0; i < this.outputs.length; i++) {
                for (let j = 0; j < this.outputs[i].byteLength; j++) {
                    text += String.fromCharCode(this.outputs[i].getUint8(j));
                }
            }
        }

        this.outputReceive.textContent = text;

        this.outputReceive.scrollTop = this.outputReceive.scrollHeight;
    }

    inputIsHex() {
        return this.modeHex.checked;
    }

    outputIsHex() {
        return this.modeOutputHex.checked;
    }

    getInput() {
        return this.inputSend.value;
    }

    displayWarningBanner() {
        this.warningBanner.style.display = 'block';

        this.changeState(Status.NO_BLUETOOTH);

        const user = navigator.userAgent;
        const os = user.includes('Android') ? 'Android' :
            user.includes('iPhone') || user.includes('iPad') ? 'iOS' :
                user.includes('Linux') ? 'Linux' :
                    user.includes('Windows') ? 'Windows' :
                        user.includes('Mac') ? 'MacOS' : 'Unknown';

        this.warningBanner.innerHTML = `<strong>Warning!</strong> Bluetooth is not available in this session.<br>`;

        switch (os) {
            case 'Android':
                this.warningBanner.innerHTML += `On Android, please use Chrome.`;
                break;
            case 'iOS':
                this.warningBanner.innerHTML += `On iOS, please use Safari.`;
                break;
            case 'Linux':
                this.warningBanner.innerHTML += `On Linux, please use Chrome.<br>`;
                this.warningBanner.innerHTML += `You may need to enable the flag "Experimental Web Platform features" by entering <code>chrome://flags/#enable-experimental-web-platform-features</code> into your browser's address bar as well as "Web Bluetooth New Permissions Backend" by entering <code>chrome://flags/#enable-web-bluetooth-new-permissions-backend</code>.`;
                break;
            case 'Windows':
                this.warningBanner.innerHTML += `On Windows, please use Chrome.`;
                break;
            case 'MacOS':
                this.warningBanner.innerHTML += `On MacOS, please use Chrome.`;
                break;
            default:
                break;
        }
    }
}