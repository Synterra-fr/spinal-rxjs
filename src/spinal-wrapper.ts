import { Observable } from "rxjs";
import { spinalCore } from "spinal-core-connectorjs_type";
import { AbstractList } from "./abstract.list";

export class SpinalWrapper {
  protected conn: any;

  public initSpinalConnexion(
    userId: string,
    password: string,
    hubIp: string,
    port = 7777,
    root = "general"
  ): void {
    this.conn = spinalCore.connect(
      `http://${userId}:${password}@${hubIp}:${port}/${root}`
    );
  }

  public store<T extends spinal.Model>(
    object: AbstractList<T>,
    name: string
  ): Observable<void> {
    return new Observable<void>((observer) => {
      spinalCore.store(
        this.conn,
        object,
        name,
        () => {
          observer.next();
          observer.complete();
        },
        () => observer.error("Fail storing model" + name)
      );
    });
  }

  public load<T extends spinal.Model>(
    name: string
  ): Observable<AbstractList<T>> {
    return new Observable<AbstractList<T>>((observer) => {
      spinalCore.load(
        this.conn,
        name,
        (object: AbstractList<T>) => {
          if (!object) {
            observer.next();
            observer.complete();
            return;
          }

          object.bind(() => {
            observer.next(object);
          });
        },
        () => observer.error("Fail loading model " + name)
      );
    });
  }
}
