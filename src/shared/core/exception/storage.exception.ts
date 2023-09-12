export abstract class StorageException extends Error {}

export class StorageInternalException extends StorageException {}

export class StorageClientException extends StorageException {}
