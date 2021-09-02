import { Bool, Lst, Model, Str, Val } from "spinal-core-connectorjs_type";
import { PartialDeep } from "type-fest";

export function validatePartial<T extends spinal.Model, K>(
  partial: PartialDeep<K>,
  root: T
): boolean {
  for (const key in partial) {
    if (Object.prototype.hasOwnProperty.call(partial, key)) {
      if ((root[key] as any) instanceof Lst) {
        const array = partial[key] as unknown as any[];
        for (let i = 0; i < array.length; i++) {
          const element = array[i];
          let match = false;
          for (let j = 0; j < root[key].length; j++) {
            const nodeElement = root[key][j];
            if (this.validatePartial(element, nodeElement)) {
              match = true;
              break;
            }
          }
          if (!match) {
            return false;
          }
        }
        continue;
      } else if (
        (root[key] as any) instanceof Val ||
        (root[key] as any) instanceof Str ||
        (root[key] as any) instanceof Bool
      ) {
        const nodeValue = (root[key] as any)?.get();
        if (nodeValue !== partial[key]) {
          return false;
        }
      } else if ((root[key] as any) instanceof Model) {
        if (!this.validatePartial(partial[key] as any, root[key] as any)) {
          return false;
        }
      } else {
        throw new Error("We don't do that here");
      }
    }
  }
  return true;
}
