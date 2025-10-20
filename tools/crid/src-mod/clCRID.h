#pragma once

#include "clUTF.h"

class clCRID
{
public:
	clCRID(unsigned int ciphKey1 = 0x207DFFFF, unsigned int ciphKey2 = 0x00B8F21B);

	static bool CheckFile(void *data, unsigned int size);
	bool LoadFile(const char *filename);

	bool Demux(const char *filename, const char *directory, bool is_demux_video, bool is_demux_info, bool is_demux_audio, bool is_convert_adx, bool is_internal_names);
	bool Mux(const char *filename, const char *filenameMovie, const char *filenameAudio);

	unsigned int GetFileCount(void) { return _utf.GetPageCount(); }
	const char *GetFilename(unsigned int index) { return _utf.GetElement(index, "filename")->GetValueString(); }

	void SetMaskAudioFromFile(FILE *mask);

private:
	struct stInfo
	{
		unsigned int signature;
		unsigned int dataSize;
		unsigned char r08;
		unsigned char dataOffset;
		unsigned short paddingSize;
		unsigned char r0C;
		unsigned char r0D;
		unsigned char r0E;
		unsigned char dataType : 2;
		unsigned char r0F_1 : 2;
		unsigned char r0F_2 : 4;
		unsigned int frameTime;
		unsigned int frameRate;
		unsigned int r18;
		unsigned int r1C;
	};
	clUTF _utf;
	unsigned char _videoMask1[0x20];
	unsigned char _videoMask2[0x20];
	unsigned char _audioMask[0x20];
	void InitMask(unsigned int key1, unsigned int key2);
	void MaskVideo(unsigned char *data, int size);
	void MaskAudio(unsigned char *data, int size);
	static void WriteInfo(FILE *fp, const char *string);
};
