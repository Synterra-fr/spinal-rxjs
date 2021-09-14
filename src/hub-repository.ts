import { map, Observable } from 'rxjs';
import { Bool, Lst, Model, Str, Val } from 'spinal-core-connectorjs_type';

import { AbstractHubRepository } from './abstract-hub-repository';


export abstract class HubRepository<T extends spinal.Model
    > extends AbstractHubRepository<T> {


    update<U>(update: U): Observable<void> {
        return this.load()
            .pipe(map((model) => this.recursivelyUpdate(update, model)));
    }

    private recursivelyUpdate(update: any, model: spinal.Model): void {
        Object.keys(update).forEach((key) => {
            const updateValue = update[key];
            const modelValue = model[key];
            const attr = {};
            attr[key] = updateValue;
            if (!modelValue) {
                model.add_attr(attr);
                return;
            }

            if (modelValue instanceof Lst) {
                console.warn('update not implemented for Lst');
                return;
            }

            const isModelValuePrimitive =
                modelValue instanceof Val ||
                modelValue instanceof Str ||
                modelValue instanceof Bool;

            if (isModelValuePrimitive && typeof updateValue === 'object') {
                modelValue.set_attr(updateValue);
                return;
            }

            if (isModelValuePrimitive && typeof updateValue !== 'object') {
                const primitiveValue = modelValue.get();
                if (primitiveValue !== updateValue) {
                    model.mod_attr(key, updateValue);
                }
                return;
            }

            const isModelValueComplexe = modelValue instanceof Model;
            if (isModelValueComplexe && typeof updateValue !== 'object') {
                model.set_attr(attr);
                return;
            }

            if (isModelValueComplexe && typeof updateValue === 'object') {
                this.recursivelyUpdate(updateValue, modelValue);
                return;
            }

            console.warn(modelValue?.constructor?.name);
            console.warn(updateValue.constructor.name);
        });
    }
}