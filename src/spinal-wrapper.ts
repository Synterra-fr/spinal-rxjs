import { Observable } from "rxjs";
import { spinalCore } from "spinal-core-connectorjs_type";

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
    object: T,
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

  public load<T extends spinal.Model>(name: string): Observable<T> {
    return new Observable<T>((observer) => {
      spinalCore.load(
        this.conn,
        name,
        (object: T) => {
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
