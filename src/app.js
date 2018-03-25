import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import styled from 'styled-components';

const GAME_STATE = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  SHOWDOWN: 'SHOWDOWN',
  FINISHED: 'FINISHED',
};

const ACTIONS = {
  START: 'START',
  DRAW: 'DRAW',
  EARLY_DRAW: 'EARLY_DRAW',
};

const Board = styled.main`
  display: flex;
  height: 100vh;
`;
const DrawButton = styled.button`
  flex: 1 1 auto;
  padding: 25px;
  border: solid black 2px;
  background: lightgray;
  font-size: 8vw;
  ${p => (p.isCountdown ? 'background: lightblue;' : '')};
  ${p => (p.isShowdown ? 'background: red;' : '')};
  ${p => (p.hasDrawn ? 'background: gray;' : '')};
  ${p => (p.isLoser ? 'background: yellow;' : '')};
  ${p => (p.hasDrawnEarly ? 'background: #333;' : '')};
  ${p => (p.isWinner ? 'background: lightgreen;' : '')};
`;

const ControlPanel = styled.div`
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;
  background-color: white;
`;

const StartButton = styled.button`
  font-size: 8vw;
  background-color: blue;
  border-radius: 0;
  color: white;
  pointer-events: auto;
`;

const TimeDisplay = styled.div``;

const handlePlayerStateChange = (playerState = {}, action) => {
  switch (action.type) {
    case ACTIONS.START:
      // Reset everything but the playerId
      return { playerId: playerState.playerId };
    case ACTIONS.EARLY_DRAW:
      return {
        ...playerState,
        hasDrawnEarly: true,
        score: 99999999,
        hasDrawn: true,
      };
    case ACTIONS.DRAW:
      if (playerState.hasDrawnEarly) {
        return playerState;
      }

      return {
        ...playerState,
        hasDrawn: true,
        score: action.payload.score,
        isWinner: action.payload.drawOrder === 0,
      };
    default:
      return playerState;
  }
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameState: GAME_STATE.IDLE,
      timer: 0,
      playerCount: 2,
      playerState: {},
    };

    this.draw = this.draw.bind(this);
    this.earlyDraw = this.earlyDraw.bind(this);
    this.start = this.start.bind(this);
    this.getPlayers = this.getPlayers.bind(this);
  }

  componentDidMount() {
    // Prevent two-finger pinch from zooming out to other tabs in iOS Safari
    window.addEventListener('touchmove', e => {
      e.preventDefault();
    });

    // window.addEventListener('keydown', e => {
    //   let handled =
    //   switch (e.keyCode) {
    //   case 'CASE_1':
    //     // code...
    //   default:
    //   }
    // })
  }

  getPlayers() {
    return [...new Array(this.state.playerCount)].map(
      (_, playerId) => this.state.playerState[playerId] || { playerId }
    );
  }

  start() {
    const preFaceOffTimer = 1000 + Math.random() * 3000;
    this.setState({
      gameState: GAME_STATE.COUNTDOWN,
      playerState: this.getPlayers().reduce((acc, player) => {
        acc[player.playerId] = handlePlayerStateChange(player, {
          type: ACTIONS.START,
        });
        return acc;
      }, {}),
    });

    setTimeout(() => {
      if (this.state.gameState === GAME_STATE.FINISHED) {
        return;
      }

      this.startedAt = Date.now();
      this.setState({ gameState: GAME_STATE.SHOWDOWN });

      const redrawTimer = () =>
        requestAnimationFrame(() => {
          this.setState({
            timer: Date.now() - this.startedAt,
          });

          if (this.state.gameState === GAME_STATE.SHOWDOWN) {
            redrawTimer();
          }
        });
      redrawTimer();
    }, preFaceOffTimer);
  }

  draw(playerId) {
    const { playerState, playerCount } = this.state;
    if (playerState[playerId] && playerState[playerId].hasDrawn) {
      return;
    }

    const playersDrawnSoFar = this.getPlayers().filter(
      p => p.hasDrawn && !p.hasDrawnEarly
    );

    const allPlayersHaveDrawn =
      this.getPlayers().filter(p => p.hasDrawn).length >= playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: handlePlayerStateChange(playerState[playerId], {
          type: ACTIONS.DRAW,
          payload: {
            score: Date.now() - this.startedAt,
            drawOrder: playersDrawnSoFar.length,
          },
        }),
      },
      ...(allPlayersHaveDrawn ? { gameState: GAME_STATE.FINISHED } : {}),
    });
  }

  earlyDraw(playerId) {
    const { playerState, playerCount } = this.state;

    const allPlayersHaveDrawn =
      this.getPlayers().filter(p => p.hasDrawn).length >= playerCount - 1;

    this.setState({
      playerState: {
        ...playerState,
        [playerId]: handlePlayerStateChange(playerState[playerId], {
          type: ACTIONS.EARLY_DRAW,
        }),
      },
      ...(allPlayersHaveDrawn ? { gameState: GAME_STATE.FINISHED } : {}),
    });
  }

  render() {
    const { timer, gameState } = this.state;
    const fireEvent = playerId =>
      ({
        [GAME_STATE.COUNTDOWN]: () => this.earlyDraw(playerId),
        [GAME_STATE.SHOWDOWN]: () => this.draw(playerId),
      }[gameState] || (event => event.preventDefault()));
    const startButton = (
      <StartButton
        onClick={this.start}
        disabled={
          gameState !== GAME_STATE.IDLE && gameState !== GAME_STATE.FINISHED
        }
      >
        START
      </StartButton>
    );
    return (
      <div>
        <Board>
          {this.getPlayers().map(
            ({ playerId, score, isWinner, hasDrawn, hasDrawnEarly }) => (
              <DrawButton
                key={playerId} // eslint-disable-line react/no-array-index-key
                disabled={
                  gameState !== GAME_STATE.COUNTDOWN &&
                  gameState !== GAME_STATE.SHOWDOWN
                }
                isCountdown={gameState === GAME_STATE.COUNTDOWN}
                isShowdown={gameState === GAME_STATE.SHOWDOWN}
                hasDrawn={hasDrawn}
                isLoser={hasDrawn && !isWinner}
                isWinner={isWinner}
                hasDrawnEarly={hasDrawnEarly}
                onMouseDown={fireEvent(playerId)}
                onTouchStart={fireEvent(playerId)}
              >
                {gameState === GAME_STATE.SHOWDOWN ? 'draw!!!' : 'wait...'}
                <br />
                {gameState === GAME_STATE.FINISHED && !hasDrawnEarly
                  ? `${score / 1000}s`
                  : ''}
              </DrawButton>
            )
          )}
        </Board>

        <ControlPanel>
          {{
            [GAME_STATE.SHOWDOWN]: <TimeDisplay>{timer}</TimeDisplay>,
            [GAME_STATE.IDLE]: startButton,
            [GAME_STATE.FINISHED]: startButton,
          }[gameState] || ''}
        </ControlPanel>
      </div>
    );
  }
}

export default hot(module)(App);
