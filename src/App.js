import React, { Component } from 'react';
import './App.css';
import alarmBeep from './alarm-beep.mp3';
import EventEditor from './EventEditor';

function seconds2string(seconds) {
  if (seconds === 0) return 'Now';
  let min = Math.floor(seconds / 60);
  let sec = seconds - min * 60;
  if (min < 10) min = '0' + min; // padd a zero
  if (sec < 10) sec = '0' + sec; // padd a zero
  return min + ':' + sec;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showEventList: true,
      start: null,
      secondsElapsed: 0,
      earlyWarnSeconds: 0,
      eventCompleteCnt: 0,
      events: [
        {time: 5,  text: 'Add Cascade'},
        {time: 10, text: 'Add Citra'},
        {time: 15, text: 'Add Fuggle'},
        {time: 20, text: 'Drink a beer'},
        {time: 3540, text: 'Add Chinook'},
        {time: 3630, text: 'Drink another beer'},
      ],
    };
    this.editEventList = this.editEventList.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.tick = this.tick.bind(this);
    this.clearCountdown = this.clearCountdown.bind(this);
    this.alert = this.alert.bind(this);
    this.beepSound = new Audio(alarmBeep);
  }

  editEventList(editedListText) {
    let newState = { events: [] };
    editedListText.split('\n').forEach((line) => {
      if (line.startsWith('//') || line === '') return;
      if (line.startsWith('early warning seconds=')) {
        newState.earlyWarnSeconds = +line.split('=')[1];
        if (isNaN(newState.earlyWarnSeconds)) {
          newState.earlyWarnSeconds = 0;
        }
        return;
      }
      let [min, sec, desc] = line.split(new RegExp(',|:', 'g'));
      let newtime = min * 60 + +sec;
      newState.events.push({time: newtime, text: desc});
    });
    newState.events.sort((a, b) => a.time - b.time);
    this.setState(newState);
  }

  startCountdown() {
    this.setState({start: new Date()});
    this.timerID = setInterval(
      () => this.tick(),
      500
    );
  }

  tick() {
    let elapsed = new Date() - this.state.start;
    if (elapsed < 0) {
      this.setState({secondsElapsed: 0});
      return;
    }
    elapsed = Math.floor(elapsed/1000);
    let newState = {secondsElapsed: elapsed};
    // do we need to sound the alarm?
    let i = this.state.eventCompleteCnt;
    if (i <= this.state.events.length && this.state.events[i].time - elapsed <= this.state.earlyWarnSeconds) {
      this.alert();
      newState.eventCompleteCnt = i + 1;
      console.log('finished events: ' + newState.eventCompleteCnt);
    }
    this.setState(newState);
  }

  clearCountdown() {
    clearInterval(this.timerID);
    this.setState({
      start: null,
      now: null,
      secondsElapsed: 0,
      eventCompleteCnt: 0,
    });
  }

  alert() {
    if (this.alertIntervalID) {
      return;
    }
    this.beepSound.play();
    // flash the background color
    let x = 0;
    this.alertIntervalID = setInterval(() => {
      if (document.body.style.backgroundColor === 'red') {
        document.body.style.backgroundColor = 'white';
      } else {
        document.body.style.backgroundColor = 'red';
      }
      if (++x === 15) {
        document.body.style.backgroundColor = null; // reset it
        clearInterval(this.alertIntervalID);
        this.alertIntervalID = null;
      }
    }, 120);
  }

  render() {
    const eventList = this.state.events.map((event, i) => {
      let timeRemaining = event.time - this.state.secondsElapsed;
      let timeText;
      if (timeRemaining < 0) {
        timeText = 'Done';
      } else {
        timeText = seconds2string(timeRemaining);
      }
      return (
        <tr key={i}>
          <td className="event-text">{event.text}</td>
          <td className="event-time">{timeText}</td>
        </tr>
      );
    });

    let nextUpEvent = this.state.events.find((event) => (event.time - this.state.secondsElapsed) > 0);
    if (nextUpEvent) {
      nextUpEvent.timeRemaining = nextUpEvent.time - this.state.secondsElapsed;
    } else {
      nextUpEvent = {text: 'Nothing!', timeRemaining: 0};
    }

    return (
      <div className="App">
        <div className={this.state.showEventList ? 'event-list events-showing' : 'event-list'}>
          <div>
            <a onClick={() => this.setState({showEventList: false})}>Hide event list</a>
          </div>

          <div>
            <table>
              <tbody>
                {eventList}
              </tbody>
            </table>
          </div>

          <EventEditor list={this.state.events} earlyWarning={this.state.earlyWarnSeconds} update={this.editEventList} />
        </div>

        <div className={this.state.showEventList ? 'up-next events-showing' : 'up-next'}>
          <div style={{display: 'block'}}>
            <div style={{float: 'left'}}>
              {!this.state.showEventList && <a onClick={() => this.setState({showEventList: true})}>Show event list</a>}
            </div>
            <div style={{float: 'right'}}>
              <div>Elapsed time: {this.state.secondsElapsed === 0 ? '00:00' : seconds2string(this.state.secondsElapsed)}</div>
              <a onClick={this.alert}>Test alert</a>
            </div>
            <div style={{clear: 'both'}}></div>
          </div>

          <div>
            <h3>Next up</h3>
            <p>warning you before by {this.state.earlyWarnSeconds} seconds</p>
            <h1>{nextUpEvent.text} in {seconds2string(nextUpEvent.timeRemaining)}</h1>
            {this.state.start ? <a onClick={this.clearCountdown}>Reset</a> : <a onClick={this.startCountdown}>Start</a>}
          </div>
        </div>
      </div>
    );
  }
}

export default App;