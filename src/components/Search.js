import React from "react";
import "../../styles/components/search.scss";
import "../../styles/index.scss";
// import SearchGallery from "./SearchGallery";

class Search extends React.Component {
  constructor() {
    super();

    this.state = {
      searchGame: "",
      count: 0
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addToFavourites = this.addToFavourites.bind(this);
    this.handleClick = this.handleClick.bind(this);

  }

  componentDidMount() {
    this.props.fetchReferenceData();
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({
      searchGame: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.fetchGameInfo("/games/" + this.state.searchGame);
    this.setState({
      searchGame: ""
    });
  }

  handleClick() {
    this.setState({
      count: this.state.count + 1
    })
  }

  addToFavourites(gameId, gameTitle) {
    if (this.props.userAuthState) {
      const newFav = {
        gamerId: this.props.userAuthState.userId,
        igdb: gameId,
        title: gameTitle
      }
      console.log("search.js", newFav)
      this.props.addToFavourite(newFav)

    } else {
      alert("Please log in to select favourites")
    }

  }
  render() {
    const { gameData, userAuthState } = this.props;
    const imagesArr = gameData.map(img => {
      <img src={
        img.screenshot[this.state.count]
      } />
    })
    const gameDisplay =
      gameData === "No results found" ? <div className="search__result"> <div className="search__details"> {gameData} </div></div> :
        gameData.map(game => {
          return (
            <li key={game.igdbId} className="search__result">
              <div className="search__img">
                <img src={game.cover_img} className="search__img--cover" />
                <button className="search__details--button" onClick={event => { this.addToFavourites(game.igdbId, game.name) }}>Add to favourites</button>
              </div>
              <div className="search__details">
                <header className="search__details--name">{game.name}</header>

                {game.description !== "" || game.description !== undefined ? (
                  <p className="search__desc">{game.description}</p>
                ) : null}
                <div className="search__box">
                  <div className="search__info">
                    {game.user_rating ? (
                      <header className="search__details--ratings">
                        Gamer Rating:{" "}
                        <span className="search__rating">
                          {game.user_rating}%
                          </span>
                      </header>
                    ) : null}

                    {game.critic_rating ? (
                      <header className="search__details--ratings">
                        Critic Rating:{" "}
                        <span className="search__rating">
                          {game.critic_rating}%
                          </span>
                      </header>
                    ) : null}

                    {game.genres ? (
                      <header className="search__details--ratings">
                        Genre:{" "}
                        <span className="search__rating">{game.genres}</span>
                      </header>
                    ) : null}

                    {game.themes ? (
                      <header className="search__details--ratings">
                        Theme:<span className="search__rating">
                          {" "}
                          {game.themes}
                        </span>
                      </header>
                    ) : null}
                  </div>

                  <div className="search__video">
                    {game.video ? (
                      <iframe
                        width="560"
                        height="315"
                        src={game.video + "autoPlay=0"}

                        frameBorder="0"
                        allowFullScreen
                        autostart="false"

                      />
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="search__screenshots">
                {imagesArr}
              </div>

              <br />

            </li>
          );
        });
    const displayStatus = userAuthState ? "Welcome Gamer " + userAuthState.userId : "You are not logged in"
    return (

      <div className="search__body">
        <div className="search">
          {displayStatus}
          <br />
          <form
            className="search__form"
            id="search__form"
            onSubmit={this.handleSubmit}
          >
            <input
              onChange={this.handleChange}
              type="search"
              results="0"
              alt="Search"
              className="search__input"
              // id="search__text"
              autoComplete="off"
              value={this.state.searchGame}
              placeholder="Search games"
            />
          </form>
          <br />
          <ul className="search__wrapper">{gameDisplay}</ul>
          <footer className="search__footer">Powered by IGDB.com API</footer>
        </div>
      </div>
    );
  }
}

export default Search;

// {game.screenshot
//   ? game.screenshot.map(currentImg => {
//     return <img src={currentImg} key={currentImg} />;
//   })
//   : null}