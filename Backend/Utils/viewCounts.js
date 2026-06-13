import History from '../Models/History.js';

export const backfillVideoViewsFromHistory = async (video) => {
    if (!video?._id) return video;

    const uniqueViewerIds = await History.distinct('user', { videoId: video._id });
    const historyViewCount = uniqueViewerIds.length;

    if ((video.views || 0) >= historyViewCount) return video;

    video.views = historyViewCount;
    await video.save();
    return video;
};
