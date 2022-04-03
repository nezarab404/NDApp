import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:nwallet/shared/my_observer.dart';
import 'package:nwallet/shared/storage/shared_helper.dart';
import 'package:nwallet/src/Home/cubit/home_cubit.dart';
import 'package:nwallet/src/Home/home_screen.dart';
import 'package:sizer/sizer.dart';

void main() async {
  BlocOverrides.runZoned(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await dotenv.load(fileName: ".env");
      SharedHelper.init();
      runApp(const MyApp());
    },
    blocObserver: MyBlocObserver(),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<HomeCubit>(create: (_) => HomeCubit()),
      ],
      child: Sizer(
        builder: (context, orientation, deviceType) => MaterialApp(
            title: 'NDApp',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
            ),
            home: const HomeScreen(),),
      ),
    );
  }
}
