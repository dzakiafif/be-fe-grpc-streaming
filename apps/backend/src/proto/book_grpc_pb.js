// GENERATED CODE -- DO NOT EDIT!

'use strict';
var book_pb = require('./book_pb.js');

function serialize_book_BookStreamRequest(arg) {
  if (!(arg instanceof book_pb.BookStreamRequest)) {
    throw new Error('Expected argument of type book.BookStreamRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_book_BookStreamRequest(buffer_arg) {
  return book_pb.BookStreamRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_book_BookStreamResponse(arg) {
  if (!(arg instanceof book_pb.BookStreamResponse)) {
    throw new Error('Expected argument of type book.BookStreamResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_book_BookStreamResponse(buffer_arg) {
  return book_pb.BookStreamResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service untuk manage buku dengan bidirectional streaming
var BookServiceService = exports['book.BookService'] = {
  // Bidirectional streaming untuk real-time updates
// Client kirim action (CREATE/UPDATE/DELETE/LIST)
// Server broadcast perubahan ke semua clients
streamBooks: {
    path: '/book.BookService/StreamBooks',
    requestStream: true,
    responseStream: true,
    requestType: book_pb.BookStreamRequest,
    responseType: book_pb.BookStreamResponse,
    requestSerialize: serialize_book_BookStreamRequest,
    requestDeserialize: deserialize_book_BookStreamRequest,
    responseSerialize: serialize_book_BookStreamResponse,
    responseDeserialize: deserialize_book_BookStreamResponse,
  },
};

