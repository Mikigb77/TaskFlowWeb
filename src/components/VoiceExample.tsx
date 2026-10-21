import Icon from "./Icon";
import { copy, type SiteLanguage } from "../content/site";

// WD1's static example: what you could say, and the tasks the app would show for it.
// It has no inputs and renders on the server, so it shows without JavaScript, and
// wherever the live demo can't run.
export default function VoiceExample({ language }: { language: SiteLanguage }) {
  const { label, quote, heading, tasks } = copy[language].voice.example;
  return (
    <div className="voice-example">
      <p className="voice-example-label">{label}</p>
      <p className="voice-example-quote">{quote}</p>
      <div className="voice-example-result">
        <p className="voice-example-heading">{heading}</p>
        <ul>
          {tasks.map((task) => (
            <li key={task.title}>
              <span className="voice-example-title">{task.title}</span>
              <span className="voice-example-date">
                <Icon name="calendar" size={16} />
                {task.date}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
