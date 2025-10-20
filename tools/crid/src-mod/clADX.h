#pragma once

#include <stdio.h>

class clADX
{
public:
	clADX();
	~clADX();

	static bool CheckFile(void *data);

	bool Decode(const char *filename, const char *filenameWAV);
	bool Decode(FILE *fp, void *data, int size, unsigned int address);

private:
	struct stHeader
	{
		unsigned short signature;
		unsigned short dataOffset;
		unsigned char r04;
		unsigned char r05;
		unsigned char r06;
		unsigned char channelCount;
		unsigned int samplingRate;
		unsigned int sampleCount;
		unsigned char r10;
		unsigned char r11;
		unsigned char r12;
		unsigned char r13;
		unsigned int r14;
		unsigned short r18;
		unsigned short r1A;
		unsigned short r1C;
		unsigned short r1E;
	};
	struct stInfo
	{
		unsigned short r00;
		unsigned short r02;
	};
	struct stAINF
	{
		unsigned int ainf;
		unsigned int r04;
		unsigned char r08[0x10];
		unsigned short r18;
		unsigned short r1A;
		unsigned short r1C;
		unsigned short r1E;
	};
	stHeader _header;
	int *_data;
	static void Decode(int *d, unsigned char *s);
};
