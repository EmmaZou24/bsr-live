import scheduleImage from '../../assets/schedule.png'
import { NavPage } from '../NavPage'
import '../nav-page.css'
import './schedule-page.css'

export function SchedulePage() {
  return (
    <NavPage title="schedule" className="nav-page--schedule">
      <img className="schedule-page__image" src={scheduleImage} alt="Weekly radio schedule" />
    </NavPage>
  )
}
