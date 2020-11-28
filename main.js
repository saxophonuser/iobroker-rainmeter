'use strict';

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");

/** @type {number | undefined} */
let rainQuantity;

class RainMeter extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'rainmeter',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info('config triggerVariable: ' + this.config.triggerVariable);
        this.log.info('config rainQuantity: ' + this.config.rainQuantity);

        rainQuantity = parseFloat(this.config.rainQuantity);

        this.log.info('rainQuantity as float: ' + rainQuantity);

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.

        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');
        this.subscribeForeignStates(this.config.triggerVariable); // subscribe on variable "forecast.html" of all adapter instances "yr".

        this.createStates();

        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system

        // same thing, but the state is deleted after 30s (getState will return null afterwards)

        // examples for the checkPassword/checkGroup functions
        // let result = await this.checkPasswordAsync('admin', 'iobroker');
        // this.log.info('check user admin pw iobroker: ' + result);

        // result = await this.checkGroupAsync('admin', 'admin');
        // this.log.info('check group user admin group admin: ' + result);
    }

    async createStates()
    {
        var thisHelper = this;

        await this.createNewState('rainQuantity');
        await this.createNewState('numberOfInputSignals');
        await this.createNewState('year');
        await this.createNewState('quarter');
        await this.createNewState('month');
        await this.createNewState('week');
        await this.createNewState('day');
        await this.createNewState('hour');
        await this.createNewState('yesterday');
        await this.createNewState('dayBeforeYesterday');

        this.setValue('rainQuantity', 0.0);
        this.setValue('numberOfInputSignals', 0);
        this.setValue('year', 0.0);
        this.setValue('quarter', 0.0);
        this.setValue('month', 0.0);
        this.setValue('week', 0.0);
        this.setValue('day', 0.0);
        this.setValue('hour', 0.0);
        this.setValue('yesterday', 0.0);
        this.setValue('dayBeforeYesterday', 0.0);
    }

    async createNewState(name)
    {
        await this.setObjectNotExistsAsync(name, {
            type: 'state',
            common: {
                name: name,
                type: 'number',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
    }

    async setValue(name, newValue)
    {
        var thisHelper = this;
        this.getStateAsync(name, function (err, value) {
            if (value == null) {
                thisHelper.log.info(name + " is null, set it to " + newValue);
                thisHelper.setStateAsync(name, newValue);
            }
            else
                thisHelper.log.info(name + " value = " + value.val);
        });
    }

    async increment(name)
    {
        var thisHelper = this;
        this.getStateAsync(name, function (err, value) {
            if (value == null) {
                thisHelper.setStateAsync(name, 0);
            }
            else {
                var newValue = Math.round(100 * (value.val  + rainQuantity )) / 100
                thisHelper.setStateAsync(name, newValue);
            }
        });
    }

    incrementAll() {
        this.increment('rainQuantity');
        this.increment('year');
        this.increment('quarter');
        this.increment('month');
        this.increment('week');
        this.increment('day');
        this.increment('yesterday');
        this.increment('dayBeforeYesterday');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            var help = this;
            // The state was changed
            if (id == this.config.triggerVariable)
            {
                // this.getState('rainQuantity', function (err, quantity) {
                //
                //     help.log.info('old value = ' + quantity.val);
                //     var value = quantity.val + rainQuantity;
                //     help.log.info('new value = ' + value);
                //     help.setStateAsync('rainQuantity', Number(value.toFixed(2)));
                //
                //     help.log.info(
                //         '  Value: '        + quantity.val +
                //         ', ack: '          + quantity.ack +
                //         ', time stamp: '   + quantity.ts  +
                //         ', last changed: ' + quantity.lc
                //     );
                // });
                this.incrementAll();
                this.getState('numberOfInputSignals', function (err, counter) {

                    help.log.info('old value = ' + counter.val);
                    var value = counter.val + 1;
                    help.log.info('new value = ' + value);
                    help.setStateAsync('numberOfInputSignals', Number(value.toFixed(2)));

                    help.log.info(
                        '  Value: '        + counter.val +
                        ', ack: '          + counter.ack +
                        ', time stamp: '   + counter.ts  +
                        ', last changed: ' + counter.lc
                    );
                });


            }

            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new RainMeter(options);
} else {
    // otherwise start the instance directly
    new RainMeter();
}
