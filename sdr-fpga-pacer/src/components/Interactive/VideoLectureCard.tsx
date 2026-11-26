import React from 'react';
import { VIDEO_LECTURES } from '@site/src/data/contentCatalog';
import {
  recordVideoInteraction,
  toggleVideoWatched,
  useInteractionStats
} from '@site/src/utils/interactionStats';
import styles from './styles.module.css';

interface VideoProps {
  title: string;
  youtubeId: string;
  speaker: string;
  description: string;
  takeaways: string[];
}

export default function VideoLectureCard({
  title,
  youtubeId,
  speaker,
  description,
  takeaways
}: VideoProps): React.ReactElement {
  const { stats } = useInteractionStats();
  const catalogVideo = VIDEO_LECTURES.find((v) => v.youtubeId === youtubeId);
  const videoId = catalogVideo?.id || `video-${youtubeId}`;
  const videoStat = stats.videos[videoId];
  const isWatched = Boolean(videoStat?.watched);

  return (
    <div className={styles.videoCard}>
      <div
        className={styles.videoWrapper}
        onMouseDown={() =>
          recordVideoInteraction(
            videoId,
            title,
            'Interacted with video lecture player',
            undefined,
            catalogVideo?.modulePath
          )
        }>
        <iframe
          className={styles.videoIframe}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className={styles.videoDetails}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 className={styles.videoTitle}>{title}</h4>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ifm-color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
            {speaker}
          </span>
        </div>
        <p className={styles.videoDescription}>{description}</p>
        <div style={{ background: 'var(--ifm-background-color)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎯 Key Takeaways:
          </strong>
          <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.88rem', color: 'var(--ifm-color-emphasis-700)' }}>
            {takeaways.map((point, idx) => (
              <li key={idx} style={{ marginBottom: '0.2rem' }}>{point}</li>
            ))}
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)' }}>
            {videoStat && videoStat.interactions > 0
              ? `🎬 ${videoStat.interactions} interaction${videoStat.interactions === 1 ? '' : 's'} logged`
              : '🎬 Log your lecture completion for Rankings'}
          </span>
          <button
            type="button"
            onClick={() => toggleVideoWatched(videoId, title, catalogVideo?.modulePath)}
            style={{
              background: isWatched ? '#059669' : 'var(--ifm-background-color)',
              color: isWatched ? '#ffffff' : 'var(--ifm-color-emphasis-800)',
              border: `1px solid ${isWatched ? '#059669' : 'var(--ifm-color-emphasis-300)'}`,
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            {isWatched ? '✅ Lecture Completed' : '☑️ Mark Lecture Watched'}
          </button>
        </div>
      </div>
    </div>
  );
}
