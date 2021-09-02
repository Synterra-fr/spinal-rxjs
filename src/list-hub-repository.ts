import { EMPTY, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Bool, Lst, Model, Str, Val } from "spinal-core-connectorjs_type";
import { PartialDeep } from "type-fest";
import { AbstractHubRepository } from "./abstract-hub-repository";
import { AbstractList } from "./abstract.list";
import { validatePartial } from "./utils/find.utils";

export abstract class ListHubRepository<
  T extends spinal.Model,
  K
> extends AbstractHubRepository<AbstractList<T>> {
  public findAll(): Observable<K[]> {
    return this.load().pipe(
      map((nodes: AbstractList<T>): K[] =>
        nodes.list.length === 0 ? [] : nodes.list.get()
      ),
      catchError((error) => {
        return EMPTY;
      })
    );
  }

  public find(where: PartialDeep<K> | PartialDeep<K>[]): Observable<T[]> {
    return this.load().pipe(
      map((nodes: AbstractList<T>) => {
        const models = nodes.list.filter((d: T) => {
          if (Array.isArray(where)) {
            for (const partial of where) {
              if (!validatePartial(partial, d)) {
                return false;
              }
            }
            return true;
          } else {
            return validatePartial(where, d);
          }
        });

        return models as unknown as T[];
      })
    );
  }

  public findChild(where: PartialDeep<K>) {
    return this.load().pipe(
      map((nodes: AbstractList<T>) => {
        for (let i = 0; i < nodes.list.length; i++) {
          const orderModel = nodes.list[i];
          const matchingResult = this.findPartial(where, orderModel);
          if (matchingResult) {
            return matchingResult;
          }
        }
        return;
      })
    );
  }

  private findPartial(
    partial:
      | PartialDeep<K>
      | PartialDeep<K>[Extract<keyof PartialDeep<K>, string>],
    root: spinal.Model
  ) {
    let isObjKeyValid = false;
    for (const key in partial as any) {
      if (Object.prototype.hasOwnProperty.call(partial, key)) {
        const newRoot: any = root[key];
        const newPartial = partial[key];
        if (newRoot instanceof Lst) {
          for (let i = 0; i < newRoot.length; i++) {
            const childRoot = newRoot[i];
            const matchingResult = this.findPartial(newPartial[0], childRoot);
            if (matchingResult) {
              return matchingResult;
            }
          }
        } else if (
          newRoot instanceof Val ||
          newRoot instanceof Str ||
          newRoot instanceof Bool
        ) {
          const nodeValue = newRoot?.get();
          if (nodeValue !== newPartial) {
            return;
          }
          isObjKeyValid = true;
        } else if (newRoot instanceof Model) {
          return this.findPartial(newPartial, newRoot as any);
        } else {
          throw new Error("We don't do that here");
        }
      }
    }
    if (isObjKeyValid) {
      return root;
    }
  }

  public remove(models: spinal.Model | spinal.Model[]): Observable<void> {
    return this.load().pipe(
      map((root: AbstractList<T>) => {
        if (!Array.isArray(models)) {
          models = [models];
        }
        for (const issue of models) {
          root.list.remove_ref(issue);
        }
      })
    );
  }
}
