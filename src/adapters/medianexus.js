var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');

var MN_BIDDER_ID = 'medianexus';
var MN_ADSERVER_DNS = 'creative.medianexusnetwork.com';

var MediaNexusAdapter = function MediaNexusAdapter() {
  function _handleInvalidBid(bid) {
    var bidObject = bidfactory.createBid(2);
    bidObject.bidderCode = MN_BIDDER_ID;
    bidmanager.addBidResponse(bid.adUnitCode, bidObject);
  }

  function _processBid(bid, data) {
    console.log("bid", bid, "data", data);

    var responseObj = null;
    try {
      responseObj = JSON.parse(data);
    } catch (e) {
      console.log("MN: error while unpacking response:", e);
      return _handleInvalidBid(bid);
    }

    if (!responseObj)
      return _handleInvalidBid(bid);

    if ('ad' in responseObj) {
      var bidObject = bidfactory.createBid(1);
      bidObject.bidderCode = MN_BIDDER_ID;
      bidObject.cpm = Number(responseObj.cpv * 1000);
      bidObject.ad = responseObj.ad;
      bidObject.width = responseObj.width;
      bidObject.height = responseObj.height;

      bidmanager.addBidResponse(bid.adUnitCode, bidObject);
    } else
      return _handleInvalidBid(bid);
  }

  function _requestBid(bid, dimension) {
    var xhr = new XMLHttpRequest();
    var opts = {
      d: dimension[0] + 'x' + dimension[1]
    };

    if ('subid' in bid.params)
      opts.subid = bid.params.subid;

    var url = '//' + MN_ADSERVER_DNS + '/header-bid/' + bid.params.tagid + '?';
    url += Object.keys(opts).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(opts[k])}`).join('&');

    if ("withCredentials" in xhr) {
      xhr.open("GET", url, true);
    } else if (typeof XDomainRequest !== "undefined") {
      xhr = new XDomainRequest();
      xhr.open("GET", url);
    } else {
      xhr = null;
    }

    if (!xhr)
      return;

    xhr.onload = function() {
      _processBid(bid, xhr.responseText);
    };

    xhr.send();
  }

  function _callBids(params) {
    var bids = params.bids || [];
    for (var bid of bids) {
      _requestBid(bid);
    }
  }

  return {
    callBids: _callBids
  };
};

module.exports = MediaNexusAdapter;
