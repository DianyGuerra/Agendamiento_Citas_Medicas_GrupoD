/**
 * Section for displaying detailed content with JSON parsing
 */
import PropTypes from 'prop-types';


export function DetailSection({ title, content }) {
  const parseContent = (rawContent) => {
    if (!rawContent) return null;

    if (typeof rawContent === 'string' && !rawContent.trim().startsWith('{')) {
      return rawContent;
    }

    try {
      const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

      if (parsed.subjective || parsed.objective || parsed.assessment || parsed.plan) {
        const parts = [];
        if (parsed.subjective) parts.push(`Subjetivo: ${parsed.subjective}`);
        if (parsed.objective) parts.push(`Objetivo: ${parsed.objective}`);
        if (parsed.assessment) parts.push(`Evaluación: ${parsed.assessment}`);
        if (parsed.plan) parts.push(`Plan: ${parsed.plan}`);
        return parts.join('\n\n');
      }

      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .filter(([_, value]) => value && value !== '')
          .map(
            ([key, value]) =>
              `${key.charAt(0).toUpperCase() + key.slice(1).replaceAll( '_', ' ')}: ${value}`
          )
          .join('\n');
      }

      return rawContent;
    } catch {
      return rawContent;
    }
  };

  const displayContent = parseContent(content);

  if (!displayContent) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-700 text-sm whitespace-pre-line">{displayContent}</p>
    </div>
  );
}

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
};
