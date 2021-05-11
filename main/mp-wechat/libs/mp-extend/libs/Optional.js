import {isNull, isFunction} from '../utils/common';

export class Optional {
    constructor(value, options) {
        this._value = value;
        this.isNull = isNull;
        if (options) {
            if (isFunction(options.isNull)) {
                this.isNull = options.isNull;
            }
        }
        this.o = options;
    }

    static of(value, o) {
        return new Optional(value, o);
    }

    get() {
        if (this.isNull(this._value)) {
            throw new Error('optional is empty');
        }
        return this._value;
    }

    isPresent() {
        return !this.isNull(this._value);
    }

    ifPresent(consumer) {
        if (!this.isNull(this._value)) {
            if (!isFunction(consumer)) {
                throw new Error('consumer is not a function');
            }
            consumer(this._value);
        }
    }

    filter(predicate) {
        if (!isFunction(predicate)) {
            throw new Error('predicate is not a function');
        }
        if (!this.isNull(this._value) && predicate(this._value)) {
            return Optional.of(this._value, this.o);
        }
        return Optional.of(undefined, this.o);
    }

    map(mapper) {
        if (!isFunction(mapper)) {
            throw new Error('mapper is not a function');
        }
        if (this.isNull(this._value)) {
            return Optional.of(undefined, this.o);
        }
        const mappedValue = mapper(this._value);
        return this.isNull(mappedValue) ? Optional.of(undefined, this.o) : Optional.of(mappedValue, this.o);
    }

    peek(peeker) {
        if (!isFunction(peeker)) {
            throw new Error('peeker is not a function');
        }

        if (this.isNull(this._value)) {
            return Optional.of(undefined, this.o);
        }

        peeker(this._value);

        return Optional.of(this._value, this.o);
    }

    orElse(other) {
        return this.isNull(this._value) ? other : this._value;
    }

    orElseGet(supplier) {
        if (!isFunction(supplier)) {
            throw new Error('supplier is not a function');
        }
        if (this.isNull(this._value)) {
            return supplier();
        } else {
            return this._value;
        }
    }

    ifPresentOrElse(action, emptyAction) {
        if (!this.isNull(this._value)) {
            if (!isFunction(action)) {
                throw new Error('action is not a function')
            }
            action(this._value)
        } else {
            if (!isFunction(emptyAction)) {
                throw new Error('emptyAction is not a function')
            }
            emptyAction();
        }
    }

    or(optionalSupplier) {
        if (this.isNull(this._value)) {
            if (!isFunction(optionalSupplier)) {
                throw new Error('optionalSupplier is not a function')
            }
            return optionalSupplier();
        }
        return this;
    }
}