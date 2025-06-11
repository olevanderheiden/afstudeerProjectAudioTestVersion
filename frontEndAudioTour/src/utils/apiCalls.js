const API_BASE_URL = import.meta.env.VITE_WORDPRESS_API_URL;

export async function fetchAudioTours() {
  try {
    // Get total count
    const res = await fetch(`${API_BASE_URL}/audio_tour?per_page=1`);
    if (!res.ok) throw new Error("Network response was not ok");
    const total = res.headers.get("X-WP-Total");

    // Get all items
    const allRes = await fetch(`${API_BASE_URL}/audio_tour?per_page=${total}`);
    if (!allRes.ok) throw new Error("Network response was not ok");
    const data = await allRes.json();

    //Aquire id's from wordpress
    const visualsIds = [
      ...new Set(
        data
          .map((tour) => tour.acf?.visuals)
          .filter((id) => typeof id === "number")
      ),
    ];
    const audioIds = [
      ...new Set(
        data
          .map((tour) => tour.acf?.audio)
          .filter((id) => typeof id === "number")
      ),
    ];

    let mediaMap = {};
    const allMediaIds = [...new Set([...visualsIds, ...audioIds])];
    if (allMediaIds.length > 0) {
      const apiBase = API_BASE_URL.replace(/\/wp\/v2$/, "");
      const mediaRes = await fetch(
        `${apiBase}/wp/v2/media?include=${allMediaIds.join(",")}&per_page=100`
      );
      const mediaArr = await mediaRes.json();
      mediaArr.forEach((m) => {
        mediaMap[m.id] = {
          url: m.source_url,
          mime_type: m.mime_type,
        };
      });
    }

    // Attach media info to each tour
    return data.map((tour) => {
      // Visuals
      let visuals = null;
      const visualsId = tour.acf.visuals;
      if (typeof visualsId === "number" && mediaMap[visualsId]) {
        visuals = { ...mediaMap[visualsId], id: visualsId };
      } else if (
        tour.acf.visuals &&
        tour.acf.visuals.url &&
        tour.acf.visuals.mime_type
      ) {
        visuals = tour.acf.visuals;
      }

      // Audio
      let audio = null;
      const audioId = tour.acf.audio;
      if (typeof audioId === "number" && mediaMap[audioId]) {
        audio = { ...mediaMap[audioId], id: audioId };
      } else if (
        tour.acf.audio &&
        tour.acf.audio.url &&
        tour.acf.audio.mime_type
      ) {
        audio = tour.acf.audio;
      }

      return {
        ...tour,
        acf: {
          ...tour.acf,
          visuals,
          audio,
        },
      };
    });
  } catch (err) {
    throw err;
  }
}
