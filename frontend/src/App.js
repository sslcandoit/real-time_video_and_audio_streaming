import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import Switch from "@material-ui/core/Switch"; // Importing Switch component for toggling
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
//import WaveSurfer from "wavesurfer.js";
import "./App.css"


const socket = io.connect('http://localhost:5000')

function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [filterEnabled, setFilterEnabled] = useState(false); // State to track filter toggle
	const [filterEnabledRemote, setFilterEnabledRemote] = useState(false); // For remote

	const myVideo = useRef()
	const userVideo = useRef()
	const localCanvas = useRef(null);
  	const remoteCanvas = useRef(null);
	const connectionRef= useRef();
	const analyserRef = useRef(null); // Define analyserRef here
	const analyserRefRemote = useRef(null);

	const [devices, setDevices] = useState({ audioInputs: [], audioOutputs: [] });
  	const [selectedInput, setSelectedInput] = useState("");
  	const [selectedOutput, setSelectedOutput] = useState("");

	// Audio context and filters
	const audioContextRef = useRef(null); // Ref to hold the audio context
  	const gainNodeRef = useRef(null); // Ref to hold the GainNode
  	const biquadFilterRef = useRef(null); // Ref to hold the BiquadFilterNode
	const gainNodeRefRemote = useRef(null);
	const biquadFilterRefRemote = useRef(null);

	// Separated Function to Enumerate Devices
	const enumerateDevices = async () => {
		const deviceInfos = await navigator.mediaDevices.enumerateDevices();
		const audioInputs = [];
		const audioOutputs = [];
	
		deviceInfos.forEach((deviceInfo) => {
		  if (deviceInfo.kind === 'audioinput') {
			audioInputs.push(deviceInfo);
		  } else if (deviceInfo.kind === 'audiooutput') {
			audioOutputs.push(deviceInfo);
		  }
		});
	
		setDevices({ audioInputs, audioOutputs });
	  };
	
	  // Separated Function to Handle Input Device Change (Microphone)
	  const handleInputChange = async (event) => {
		setSelectedInput(event.target.value);
		const newStream = await navigator.mediaDevices.getUserMedia({
		  audio: { deviceId: { exact: event.target.value } },
		  video: true
		});
	
		setStream(newStream);
		initializeAudioNodes(newStream, false); // Reinitialize nodes for local stream
	  };
	
	  // Separated Function to Handle Output Device Change (Speakers)
	  const handleOutputChange = async (event) => {
		setSelectedOutput(event.target.value);
		const audioElement = document.getElementById("audio-output");
		if (audioElement) {
		  audioElement.setSinkId(event.target.value);
		}
	  };
	

	// Initialize media stream and set up Web Audio API
	useEffect(() => {
		// Enumerate devices on mount
		enumerateDevices();

		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream);
				// Set video stream to video element
				myVideo.current.srcObject = stream;
				
				initializeAudioNodes(stream); // Initialize Gain and Biquad Filter
      			drawWaveform(false); // Start drawing the waveform
		});

	socket.on("me", (id) => {
			setMe(id)
		})

	socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		});
	}, [selectedInput]);

	// Function to initialize Gain and Biquad Filter for Web Audio API
	const initializeAudioNodes = (stream, isRemote = false) => {
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		audioContextRef.current = audioContext;
	
		// GainNode to control volume
		const gainNode = audioContext.createGain();
		gainNode.gain.value = 0.75; // Set initial gain
		//gainNodeRef.current = gainNode;
	
		// BiquadFilterNode for low-pass filtering (0-200 Hz)
		const biquadFilter = audioContext.createBiquadFilter();
		biquadFilter.type = "lowpass";
		biquadFilter.frequency.setValueAtTime(200, audioContext.currentTime);
		biquadFilterRef.current = biquadFilter;

		// Initialize AnalyserNode
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048; // Configure FFT size for waveform precision

		if (isRemote) {
			gainNodeRefRemote.current = gainNode;
      		biquadFilterRefRemote.current = biquadFilter;
			analyserRefRemote.current = analyser;
		  } else {
			gainNodeRef.current = gainNode;
      		biquadFilterRef.current = biquadFilter;
			analyserRef.current = analyser;
		  }
	
		// Create MediaStreamSource from the audio stream
		const source = audioContext.createMediaStreamSource(stream);
		source.connect(gainNode);
		gainNode.connect(biquadFilter);
		biquadFilter.connect(analyser); // Connect to analyser
  		analyser.connect(audioContext.destination); // Connect to speakers
	  };
	
	// Function to draw the waveform
	const drawWaveform = (isRemote = false) => {
		const analyserNode = isRemote ? analyserRefRemote.current : analyserRef.current;
		const canvasRef = isRemote ? remoteCanvas : localCanvas;
		const canvas = canvasRef.current;
		const canvasCtx = canvas.getContext("2d");
		const bufferLength = analyserNode.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
	
		const draw = () => {
		  requestAnimationFrame(draw);
		  analyserNode.getByteTimeDomainData(dataArray);
	
		  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	
		  canvasCtx.lineWidth = 2;
		  canvasCtx.strokeStyle = "rgb(0, 255, 0)";
		  canvasCtx.beginPath();
	
		  const sliceWidth = canvas.width / bufferLength;
		  let x = 0;
	
		  for (let i = 0; i < bufferLength; i++) {
			const v = dataArray[i] / 128.0;
			const y = (v * canvas.height) / 2;
	
			if (i === 0) {
			  canvasCtx.moveTo(x, y);
			} else {
			  canvasCtx.lineTo(x, y);
			}
	
			x += sliceWidth;
		  }
	
		  canvasCtx.lineTo(canvas.width, canvas.height / 2);
		  canvasCtx.stroke();
		};
	
		draw();
	  };
	
	
	// Function to toggle the filter on/off
	const toggleLocalFilter = () => {
		const audioContext = audioContextRef.current;
		const gainNode = gainNodeRef.current;
		const biquadFilter = biquadFilterRef.current;
		const analyserNode = analyserRef.current;// Assuming you have an analyserRef for the AnalyserNode

		// Resume audio context if suspended (this is common when the page goes idle)
		// if (audioContext.state === 'suspended') {
		// 	audioContext.resume();
		//   }
		// Disconnect analyser first to reconnect it later
		gainNode.disconnect();
		biquadFilter.disconnect();
		analyserNode.disconnect();

  if (filterEnabled) {
    
    gainNode.connect(audioContext.destination);
    
    // Connect analyser directly to GainNode for unfiltered audio
    gainNode.connect(analyserNode);
  } else {
    
    gainNode.connect(biquadFilter);
    biquadFilter.connect(audioContext.destination);

    // Connect analyser to BiquadFilter for filtered audio
    biquadFilter.connect(analyserNode);
  }
	setFilterEnabled(!filterEnabled);
};

	// Toggle for Remote Stream Filter
const toggleRemoteFilter = () => {
	const audioContext = audioContextRef.current;
	const gainNode = gainNodeRefRemote.current;
	const biquadFilter = biquadFilterRefRemote.current;
	const analyserNode = analyserRefRemote.current;
  
	// Disconnect nodes to safely reconnect based on filter state
	gainNode.disconnect();
	biquadFilter.disconnect();
	analyserNode.disconnect();
  
	if (filterEnabledRemote) {
	  // Disable filter: connect GainNode directly to destination
	  gainNode.connect(audioContext.destination);
	  gainNode.connect(analyserNode);
	} else {
	  // Enable filter: connect GainNode to BiquadFilter
	  gainNode.connect(biquadFilter);
	  biquadFilter.connect(audioContext.destination);
	  biquadFilter.connect(analyserNode);
	}
  
	setFilterEnabledRemote(!filterEnabledRemote);  // Toggle the remote filter state
  };

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (remoteStream) => {
				
			userVideo.current.srcObject = remoteStream;

			initializeAudioNodes(remoteStream, true); // Initialize audio nodes for remote stream
      		drawWaveform(true); // Draw waveform for remote stream
		});
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (remoteStream) => {
				userVideo.current.srcObject = remoteStream;
		  
				initializeAudioNodes(remoteStream, true); // Initialize audio nodes for remote stream
      			drawWaveform(true); // Draw waveform for remote stream
    });

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	//End Call
	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>real-time audio and video streaming app</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					<h1 >Local</h1>
					{stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
					{/* Container for waveform and toggle */}
					<div className="waveform-container"></div>
						<canvas ref={localCanvas} width={300} height={100} style={{ border: "1px solid black" }} /> {/* Local waveform below video */}
						{/* Toggle Switch for the Filter */}
						<div className="filter-toggle">
							<h3>Toggle Audio Filter (Lowpass: 0-200Hz, Gain: 0.75)</h3>
							<Switch
								checked={filterEnabled}
								onChange={toggleLocalFilter}
								color="primary"
							/>
    					</div>
    				</div>
				<div className="video">
					<h1 >Remote</h1>
					{callAccepted && !callEnded ? (
					<>
					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />
					<canvas ref={remoteCanvas} width={300} height={100} style={{ border: "1px solid black" }} /> {/* Remote waveform below video */}
					{/* Toggle for Remote Filter */}
					<div className="filter-toggle">
						<h3>Toggle Remote Audio Filter (Lowpass: 0-200Hz, Gain: 0.75)</h3>
						<Switch
						checked={filterEnabledRemote}
						onChange={toggleRemoteFilter} // Toggle for remote stream
						color="primary"
						/>
              		</div>
					</>
					): null}
				</div>
			</div>
			<div className="myId">
				<div className="device-container">
					{/* Audio Input Selection */}
					<div>
				<h3>Select Input Device (Microphone):</h3>
				<select onChange={handleInputChange} value={selectedInput}>
				{devices.audioInputs.map((input) => (
					<option key={input.deviceId} value={input.deviceId}>
					{input.label || `Microphone (${input.deviceId})`}
					</option>
				))}
				</select>
					</div>
					{/* Audio Output Selection */}
					<div>
						<h3>Select Output Device (Speakers):</h3>
						<select onChange={handleOutputChange} value={selectedOutput}>
						{devices.audioOutputs.map((output) => (
							<option key={output.deviceId} value={output.deviceId}>
							{output.label || `Speakers (${output.deviceId})`}
							</option>
						))}
						</select>
					</div>
				</div>
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App
