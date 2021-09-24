const moment = require("moment");

class qos {
    nbResTot = 0;
    nbResExpected = 0;
    ratio = 0.0;
    duration = 0;
    nbError = 0;
    _fields = {};
    fields = {
        add: (key) => {
            this._fields[key] = 0;
            if(this.fromQos) this.fromQos.fields.add(key);
            Object.defineProperty(this.fields, key, {
                get: () => this._fields[key],
                set: (v) => {
                    if(this.fromQos) this.fromQos.fields[key] = v-this.fields[key];
                    this._fields[key] = v;
                }
            });
        }
    };
    children = {};

    fromQos = null;

    timeStart = 0;
    constructor( fromObj = null) {
        this.fromQos = fromObj;

        Object.defineProperty(this, 'res', {
            get: () => this.nbResTot,
            set: (v) => {
                if (this.fromQos) this.fromQos.res = v-this.nbResTot;
                this.nbResTot = v;
            }
        });

        Object.defineProperty(this, 'resExp', {
            get: () => this.nbResExpected,
            set: (v) => {
                if (this.fromQos) this.fromQos.resExp = v-this.nbResExpected;
                this.nbResExpected = v;
            }
        });

        Object.defineProperty(this, 'err', {
            get: () => this.nbError,
            set: (v) => {
                if (this.fromQos) this.fromQos.err = v-this.nbError;
                this.nbError = v;
            }
        });

        Object.defineProperty(this, 'ratio', {
            get: () => (this.nbResExpected!==0)?this.nbResTot/this.nbResExpected:0
        });

        this.time.start();
    };
    time = {
        hasEnded: false,
        start: () => this.timeStart = moment(new Date()),
        update: () => this.duration = (!this.time.hasEnded)?moment(new Date()).diff(this.timeStart, "seconds"):this.duration,
        end: () => {this.time.update(); this.time.hasEnded=true;}
    };

    child = (key) => {
        let obj = {
            fields:{
                get: () => this._fields,
                add: (key) => {
                    obj.fields[key] = 0;
                    if(!Object.keys(this._fields).includes(key)) this.fields.add(key);
                    Object.defineProperty(obj.fields, key, {
                        get: () => obj.fields[key],
                        set: (v) => this.fields[key] += v
                    });
                }
            }
        };
        Object.defineProperty(obj, 'res', {
            get: () => this.nbResTot,
            set: (v) => this.res += v
        });
        Object.defineProperty(obj, 'resExp', {
            get: () => this.nbResExpected,
            set: (v) => this.resExp += v
        });
        Object.defineProperty(obj, 'err', {
            get: () => this.nbError,
            set: (v) => this.err += v
        });
        return this.children[key] = new qos(obj);
    };

    export = () => {
        this.time.update();
        return {
            nbResTot: this.nbResTot,
            nbResExpected: this.nbResExpected,
            ratio: this.ratio,
            duration: this.duration,
            nbError: this.nbError,
            fields: this._fields,
            details: Object.fromEntries(Object.entries(this.children).map(([k,v]) => [k, v.export()]))
        };
    };
}

module.exports = {
    qos: qos
}

