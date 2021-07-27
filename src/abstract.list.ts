import { Model } from 'spinal-core-connectorjs_type';
export abstract class AbstractList<T extends spinal.Model> extends Model {
  list: spinal.Lst<T>;

  constructor(attrs: T[] = []) {
    super();
    this.add_attr({ list: attrs });
  }
}
