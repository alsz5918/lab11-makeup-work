// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// chai
//   .request(server)
//   .get('/register')
//   .send({username: '123', password: '123'})
//   done();

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: '123', password: '123'})
      .redirects(0) //tests if the correct registration attempt correctly passes to the login page
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/login') 
        done();
      });
  });

  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'alsz', password: '5918'})
      .redirects(0) //tests if the correct registration attempt correctly passes to the login page
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/login') 
        done();
      });
  });

  it('negative : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'alsz', password: '5918'})
      .redirects(0) //tests if the incorrect registration attempt correctly sends the user to reattempt registration
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/register')
        done();
      });
  });

  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'alsz', password: '5918'})
      .redirects(0) //tests if the correct login attempt correctly passes into the rest of the website
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/discover')
        done();
      });
  });

  it('negative : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'alsz', password: '591'})
      .redirects(0) //tests if the incorrect login attempt correctly redirects the user to reattempt login
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res.headers.location).to.equal('/login')
        done();
      });
  });
  // ===========================================================================
  // TO-DO: Part A Login unit test case
});
