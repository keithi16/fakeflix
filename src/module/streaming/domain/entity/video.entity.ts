export type NewVideo = Omit<Video, 'id'>;

export class Video {
  readonly id: string;
  readonly name: string;
}
