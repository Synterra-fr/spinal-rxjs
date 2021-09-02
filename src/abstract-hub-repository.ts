import { Observable } from "rxjs";
import { catchError, mergeMap, skip, take } from "rxjs/operators";
import { SpinalWrapper } from "./spinal-wrapper";

export abstract class AbstractHubRepository<T extends spinal.Model> {
  protected readonly NODE_NAME: string;
  protected abstract get emptyNode(): T;

  constructor(protected readonly spinal: SpinalWrapper) {}

  public load(): Observable<T> {
    return this.loadOrCreate().pipe(take(1));
  }

  public watch(): Observable<T> {
    return this.loadOrCreate().pipe(skip(1));
  }

  public store(node = this.emptyNode): Observable<void> {
    return this.spinal.store(node, this.NODE_NAME);
  }

  private loadOrCreate(): Observable<T> {
    return this.spinalLoad().pipe(
      catchError((error) => this.createAndLoad(error))
    );
  }

  private spinalLoad(): Observable<T> {
    return this.spinal.load<T>(this.NODE_NAME);
  }

  private createAndLoad(error: any): Observable<T> {
    return this.store().pipe(mergeMap(() => this.spinalLoad()));
  }
}
