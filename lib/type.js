function HyperType(ctor) {
	this.ctor = ctor;
}

HyperType.of = function(ctor) {
	return new HyperType(ctor);
};

module.exports = HyperType;
