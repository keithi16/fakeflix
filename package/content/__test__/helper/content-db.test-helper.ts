export async function cleanUpContentDatabase(testDbClient: any): Promise<void> {
  await testDbClient('VideoMetadata').del();
  await testDbClient('Video').del();
  await testDbClient('Episode').del();
  await testDbClient('TvShow').del();
  await testDbClient('Movie').del();

  await testDbClient('Content').del();
  await testDbClient('Thumbnail').del();
}
