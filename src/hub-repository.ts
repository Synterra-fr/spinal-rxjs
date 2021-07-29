import { EMPTY, Observable } from "rxjs";
import { catchError, map, mergeMap, skip, take } from "rxjs/operators";
import { Bool, Lst, Model, Str, Val } from "spinal-core-connectorjs_type";
import { PartialDeep } from "type-fest";
import { AbstractList } from "./abstract.list";
import { SpinalWrapper } from "./spinal-wrapper";

export abstract class HubRepository<T extends spinal.Model, K> {
  protected abstract readonly NODE_NAME: string;
  protected abstract get emptyNode(): AbstractList<T>;

  constructor(protected readonly spinal: SpinalWrapper) {}

  public load(): Observable<AbstractList<T>> {
    return this.loadOrCreate().pipe(take(1));
  }

  public watch(): Observable<AbstractList<T>> {
    return this.loadOrCreate().pipe(skip(1));
  }

  public store(node = this.emptyNode) {
    console.log(this.spinal);
    return this.spinal.store(node, this.NODE_NAME);
  }

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
              if (!this.validatePartial(partial, d)) {
                return false;
              }
            }
            return true;
          } else {
            return this.validatePartial(where, d);
          }
        });

        return models as unknown as T[];
      })
    );
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

  private validatePartial(partial: PartialDeep<K>, root: T): boolean {
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

  private loadOrCreate(): Observable<AbstractList<T>> {
    return this.spinalLoad().pipe(
      catchError((error) => this.createAndLoad(error))
    );
  }

  private spinalLoad() {
    return this.spinal.load<T>(this.NODE_NAME);
  }

  private createAndLoad(error: any): Observable<AbstractList<T>> {
    return this.store().pipe(mergeMap(() => this.spinalLoad()));
  }
}
