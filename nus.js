class BluetoothNUSHandler {
    constructor() {
        this.nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
        this.nordicUARTTXCharacteristic = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
        this.nordicUARTRXCharacteristic = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

        this.currentDevice = null;
        this.uartService = null;
        this.uartTxCharacteristic = null;
        this.uartRxCharacteristic = null;
    }

    get deviceName() {
        return this.currentDevice ? this.currentDevice.name : null;
    }

    async connect() {
        if (this.isConnected()) return this.currentDevice.name;

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.nordicUARTService] }]
            });

            const server = await device.gatt.connect();
            this.uartService = await server.getPrimaryService(this.nordicUARTService);
            this.uartTxCharacteristic = await this.uartService.getCharacteristic(this.nordicUARTTXCharacteristic);
            this.uartRxCharacteristic = await this.uartService.getCharacteristic(this.nordicUARTRXCharacteristic);

            this.currentDevice = device;

            return this.deviceName;
        } catch (error) {
            this.currentDevice = null;
            this.uartService = null;
            this.uartTxCharacteristic = null;
            this.uartRxCharacteristic = null;

            if (error.name === 'NotFoundError') return this.deviceName;

            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected()) return;

        await this.currentDevice.gatt.disconnect();

        this.currentDevice = null;
        this.uartService = null;
        this.uartTxCharacteristic = null;
        this.uartRxCharacteristic = null;
    }

    async send(text, raw = false) {
        if (!this.isConnected()) throw Error('Device is not connected');

        let data = text;

        if (!raw) data = new TextEncoder().encode(data);

        try {
            await this.uartTxCharacteristic.writeValue(data);
        } catch (error) {
            // Fallback for devices with limited MTU
            const MTU = 20; // 20 MTU should be supported by all devices
            for (let i = 0; i < data.length; i += MTU) {
                await this.uartTxCharacteristic.writeValueWithoutResponse(data.slice(i, i + MTU));
            }
        }
    }

    async startNotifications(callback) {
        if (!this.isConnected()) throw Error('Device is not connected');
        if (!callback) throw Error('Callback is required');

        await this.uartRxCharacteristic.startNotifications();
        this.uartRxCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            callback(value);
        });
    }

    async stopNotifications() {
        if (!this.isConnected()) throw Error('Device is not connected');

        await this.uartRxCharacteristic.stopNotifications();
    }

    isConnected() {
        return this.currentDevice && this.currentDevice.gatt.connected;
    }
}