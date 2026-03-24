export const ExternalMovieRatingAdapter = Symbol('ExternalMovieRatingAdapter');

export interface ExternalMovieRatingAdapter {
  getRating(title: string): Promise<number | undefined>;
}
