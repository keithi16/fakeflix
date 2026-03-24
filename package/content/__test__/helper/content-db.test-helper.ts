export async function cleanUpContentDatabase(testDbClient: any): Promise<void> {
  await testDbClient('ContentVideoMetadata').del();
  await testDbClient('ContentEpisode').del();
  await testDbClient('ContentItem').del();
  await testDbClient('ContentVideo').del();
  await testDbClient('ContentThumbnail').del();
}
