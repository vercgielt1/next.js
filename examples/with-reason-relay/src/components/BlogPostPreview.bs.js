// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var ReasonRelay = require("reason-relay/src/ReasonRelay.bs.js");
var BlogPostPreview_fragment_graphql = require("../__generated__/BlogPostPreview_fragment_graphql.bs.js");

var convertFragment = BlogPostPreview_fragment_graphql.Internal.convertFragment;

var UseFragment = ReasonRelay.MakeUseFragment({
      fragmentSpec: BlogPostPreview_fragment_graphql.node,
      convertFragment: convertFragment
    });

function use(fRef) {
  return Curry._1(UseFragment.use, fRef);
}

var Fragment = {
  Operation: /* alias */0,
  Types: /* alias */0,
  UseFragment: UseFragment,
  use: use
};

function BlogPostPreview(Props) {
  var post = Props.post;
  var fragment = Curry._1(UseFragment.use, post);
  return React.createElement("li", undefined, fragment.title);
}

var make = BlogPostPreview;

exports.Fragment = Fragment;
exports.make = make;
/* UseFragment Not a pure module */
